import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { 
  Database, 
  ArrowLeft, 
  Package,
} from 'lucide-react';
import { StockPageTabs } from './StockPageTabs';

export default async function ShopStockPage({
  searchParams,
}: {
  searchParams: Promise<{ shopId?: string }>;
}) {
  const { shopId: queryShopId } = await searchParams;
  const session = await getCurrentSession();
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { shop: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SHOP_OWNER')) {
    redirect('/dashboard');
  }

  const isAdmin = user.role === 'ADMIN';
  let targetShop: { id: string; name: string } | null = null;
  if (isAdmin && queryShopId) {
    targetShop = await prisma.shop.findUnique({ where: { id: queryShopId }, select: { id: true, name: true } });
  }
  const shop = targetShop || user.shop;
  if (!shop) redirect('/shop-dashboard');

  const [productCount, activeCount, inactiveCount, outOfStockCount, totalStock] = await Promise.all([
    prisma.shopProduct.count({ where: { shopId: shop.id } }),
    prisma.shopProduct.count({ where: { shopId: shop.id, isActive: true } }),
    prisma.shopProduct.count({ where: { shopId: shop.id, isActive: false } }),
    prisma.shopProduct.count({ where: { shopId: shop.id, isActive: true, stock: 0 } }),
    prisma.shopProduct.aggregate({ where: { shopId: shop.id, isActive: true }, _sum: { stock: true } }),
  ]);

  const backHref = isAdmin && queryShopId ? `/shop-dashboard?shopId=${queryShopId}` : '/shop-dashboard';

  return (
    <div className="min-h-screen font-display">
      <div className="fixed inset-0 bg-grid opacity-30" />
      <div className="fixed inset-0 radial-gradient" />
      <div className="fixed top-20 left-10 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl animate-float" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

      <div className="relative container py-8 md:py-12">
        <div className="mb-8">
          <Link 
            href={backHref}
            className="inline-flex items-center gap-2 text-[#8888aa] hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-[#1a1a4a] border border-[rgba(255,255,255,0.12)] shadow-md text-sm">
            <Database className="w-4 h-4 text-teal-400" />
            <span className="text-[#f0f0f5]">{isAdmin && targetShop ? `Admin → ${shop.name}` : shop.name || 'My Stock'}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 font-heading">
            <span className="text-white">My </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400">Stock</span>
          </h1>
          <p className="text-[#8888aa] text-lg max-w-2xl">
            View, manage, and import your card inventory.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/10">
                <Package className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{productCount}</p>
                <p className="text-xs text-[#8888aa]">Total Products</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Package className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{activeCount}</p>
                <p className="text-xs text-[#8888aa]">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-500/10">
                <Package className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#8888aa]">{inactiveCount}</p>
                <p className="text-xs text-[#8888aa]">Inactive</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Package className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{outOfStockCount}</p>
                <p className="text-xs text-[#8888aa]">Out of Stock</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1e1e55] border border-[rgba(255,255,255,0.15)] shadow-lg rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Database className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalStock?._sum?.stock || 0}</p>
                <p className="text-xs text-[#8888aa]">Total Units</p>
              </div>
            </div>
          </div>
        </div>

        <StockPageTabs shopId={shop.id} />
      </div>
    </div>
  );
}
