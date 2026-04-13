'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Heart, ShoppingBag, Minus, Plus, ChevronLeft, Truck, ShieldCheck, RefreshCcw, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { productAPI } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { formatDeliveryDate } from '@/lib/utils';

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const { addItem, openCart, fetchCart } = useCartStore();
  const { addItem: addWishlist, removeItem: removeWishlist, isInWishlist, fetchWishlist } = useWishlistStore();
  const { token } = useAuthStore();
  
  const deliveryDate = product?.estimatedDelivery 
    ? formatDeliveryDate(product.estimatedDelivery) 
    : '';

  useEffect(() => {
    async function fetchProduct() {
      try {
        const { data } = await productAPI.getById(id as string);
        setProduct(data.data);
        if (data.data.colors?.length) setSelectedColor(data.data.colors[0]);
        if (data.data.sizes?.length) setSelectedSize(data.data.sizes[0]);
      } catch {
        toast.error('Product not found');
      }
      setLoading(false);
    }
    if (id) fetchProduct();
    if (token) {
      fetchCart();
      fetchWishlist();
    }
  }, [id, token, fetchCart, fetchWishlist]);

  const handleAddToCart = async () => {
    if (!token) { toast.error('Please login first'); router.push('/auth/login'); return; }
    if (!selectedSize) { toast.error('Please select a size'); return; }
    setIsAdding(true);
    try {
      await addItem({ 
        productId: product.id.toString(), 
        quantity, 
        size: selectedSize, 
        color: selectedColor || colors[0]?.name || 'Default' 
      });
      toast.success('Added to cart!');
      openCart();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!token) { 
      toast.error('Please login first'); 
      router.push('/auth/login'); 
      return; 
    }
    if (!selectedSize) { 
      toast.error('Please select a size'); 
      return; 
    }
    
    setIsAdding(true);
    try {
      const productColor = selectedColor || (colors[0]?.name || 'Default');
      const queryParams = new URLSearchParams({
        buy: 'now',
        productId: product.id.toString(),
        quantity: quantity.toString(),
        size: selectedSize,
        color: productColor,
      }).toString();

      router.push(`/checkout?${queryParams}`);
      
    } catch (err: any) {
      console.error('Buy Now error:', err);
      toast.error(err.response?.data?.message || 'Failed to process');
    } finally {
      setIsAdding(false);
    }
  };
  
  const toggleWishlist = async () => {
    if (!token) { toast.error('Please login first'); router.push('/auth/login'); return; }
    try {
      if (inWishlist) {
        await removeWishlist(product.id.toString());
        toast.success('Removed from wishlist');
      } else {
        await addWishlist(product.id.toString());
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { toast.error('Please login first'); return; }
    try {
      await productAPI.addReview(id as string, { rating: reviewRating, comment: reviewText });
      toast.success('Review submitted!');
      setReviewText('');
      const { data } = await productAPI.getById(id as string);
      setProduct(data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-white/50">Product not found</div>;

  const images = product.images?.map((img: any) => img.url || img.imageUrl) || ['/images/hero2.jpg'];
  const sizes = product.sizes || ['S', 'M', 'L', 'XL', 'XXL'];
  
  let colors = [{ name: 'Default', value: '#888' }];
  if (product.color && typeof product.color === 'string') {
    colors = product.color.split(',').map((c: string) => ({ name: c.trim(), value: c.trim().toLowerCase() }));
  } else if (Array.isArray(product.color)) {
    colors = product.color.map((c: string) => ({ name: c, value: c.toLowerCase() }));
  } else if (product.colors) {
    colors = product.colors;
  }
  
  const reviews = product.reviews || [];
  const discountPrice = product.discountPrice || product.salePrice;
  const inWishlist = isInWishlist(product.id?.toString());

  return (
    <div className="min-h-screen pt-24 lg:pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm text-white/30 mb-8">
          <Link href="/shop" className="flex items-center gap-1 hover:text-white/60 transition-colors"><ChevronLeft className="w-4 h-4" /> Shop</Link>
          <span>/</span><span className="text-white/50">{product.name}</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left Column - Images */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex justify-center lg:justify-end lg:pr-8">
            <div className="w-full max-w-md">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden glass mb-4 shadow-2xl border border-white/5">
                <Image src={images[selectedImage]} alt={product.name} fill className="object-cover" priority />
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img: string, i: number) => (
                    <button key={i} onClick={() => setSelectedImage(i)}
                      className={`relative aspect-square rounded-xl overflow-hidden transition-all ${selectedImage === i ? 'ring-2 ring-accent glow-red' : 'opacity-50 hover:opacity-100 hover:ring-1 hover:ring-white/30'}`}>
                      <Image src={img} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column - Details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <span className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">{product.Category?.name || product.category}</span>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{product.name}</h1>
            
            <div className="mt-3 flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.avgRating || 0) ? 'fill-accent text-accent' : 'text-white/10'}`} />)}
              </div>
              <span className="text-sm text-white/40">{product.avgRating || 0} ({reviews.length} reviews)</span>
            </div>
            
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-white">₹{(discountPrice || product.price)?.toLocaleString()}</span>
              {discountPrice && (
                <>
                  <span className="text-lg text-white/30 line-through">₹{product.price?.toLocaleString()}</span>
                  <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-bold">{Math.round(((product.price - discountPrice) / product.price) * 100)}% OFF</span>
                </>
              )}
            </div>
            
            {/* Delivery Date - Added here */}
            {deliveryDate && (
              <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-accent/5 border border-accent/15">
                <Truck className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Estimated Delivery</p>
                  <p className="text-sm font-semibold text-white">{deliveryDate}</p>
                </div>
              </div>
            )}
            
            <p className="mt-6 text-sm text-white/50 leading-relaxed">{product.description}</p>

            {/* Color selector */}
            <div className="mt-8">
              <span className="text-sm font-medium text-white/70">Color: {selectedColor}</span>
              <div className="mt-3 flex gap-3">
                {colors.map((color: any) => (
                  <button key={color.name || color} onClick={() => setSelectedColor(color.name || color)}
                    className={`w-8 h-8 rounded-full transition-all ${selectedColor === (color.name || color) ? 'ring-2 ring-offset-2 ring-offset-background ring-accent scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: color.value || color }} title={color.name || color} />
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div className="mt-8">
              <span className="text-sm font-medium text-white/70">Size</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((size: string) => (
                  <button key={size} onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 rounded-xl text-sm font-medium transition-all ${selectedSize === size ? 'bg-accent text-white glow-red' : 'glass text-white/60 hover:text-white hover:bg-white/5'}`}>{size}</button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-8 flex items-center gap-4">
              <span className="text-sm font-medium text-white/70">Qty</span>
              <div className="flex items-center glass rounded-xl">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 text-white/50 hover:text-white transition-colors"><Minus className="w-4 h-4" /></button>
                <span className="w-12 text-center text-sm font-medium text-white">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))} className="p-3 text-white/50 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
              <span className="text-xs text-white/30">{product.stock || 0} in stock</span>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-3">
              <button onClick={handleAddToCart} disabled={isAdding || product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-white/20 text-white font-semibold hover:bg-white/5 transition-all disabled:opacity-50">
                <ShoppingBag className="w-5 h-5" /> {isAdding ? 'Adding...' : 'Add to Cart'}
              </button>
              <button onClick={handleBuyNow} disabled={isAdding || product.stock === 0}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all glow-red-hover disabled:opacity-50">
                <Zap className="w-5 h-5" /> Buy Now
              </button>
              <button onClick={toggleWishlist} className={`p-4 rounded-xl glass glass-hover transition-colors ${inWishlist ? 'text-accent' : 'text-white/50 hover:text-accent'}`}>
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-accent' : ''}`} />
              </button>
            </div>

            {/* Perks */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="text-center py-3 rounded-xl glass"><Truck className="w-4 h-4 mx-auto text-accent mb-1" /><span className="text-[10px] text-white/40">Free Delivery</span></div>
              <div className="text-center py-3 rounded-xl glass"><ShieldCheck className="w-4 h-4 mx-auto text-accent mb-1" /><span className="text-[10px] text-white/40">Genuine Product</span></div>
              <div className="text-center py-3 rounded-xl glass"><RefreshCcw className="w-4 h-4 mx-auto text-accent mb-1" /><span className="text-[10px] text-white/40">Easy Returns</span></div>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-24">
          <h2 className="text-2xl font-bold gradient-text mb-8">Reviews</h2>
          {token && (
            <form onSubmit={handleReview} className="mb-8 p-6 rounded-2xl glass-strong">
              <h3 className="text-sm font-semibold text-white mb-4">Write a review</h3>
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button key={r} type="button" onClick={() => setReviewRating(r)}>
                    <Star className={`w-5 h-5 ${r <= reviewRating ? 'fill-accent text-accent' : 'text-white/10'}`} />
                  </button>
                ))}
              </div>
              <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} required placeholder="Share your experience..." rows={3}
                className="w-full rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50 transition-all resize-none" />
              <button type="submit" className="mt-3 px-6 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-all">Submit Review</button>
            </form>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.length > 0 ? reviews.map((review: any) => (
              <div key={review.id} className="p-6 rounded-2xl glass">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-accent text-accent' : 'text-white/10'}`} />)}
                </div>
                <p className="text-sm text-white/60 leading-relaxed">{review.comment}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-white/30">
                  <span className="font-medium text-white/50">{review.User?.name || review.user}</span>
                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )) : <p className="text-white/30 text-sm">No reviews yet. Be the first to review!</p>}
          </div>
        </motion.section>
      </div>
    </div>
  );
}