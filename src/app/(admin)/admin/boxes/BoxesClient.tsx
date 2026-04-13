'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Trash2, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';

type Box = {
  id: string;
  name: string;
  description: string;
  price: number;
  cardsPerPack: number;
  isActive: boolean;
};

export function BoxesClient({ boxes: initialBoxes }: { boxes: Box[] }) {
  const t = useTranslations('admin.boxesMgmt');
  const tc = useTranslations('common');
  const router = useRouter();
  const { addToast } = useToast();
  const [boxes, setBoxes] = useState(initialBoxes);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (boxId: string, boxName: string) => {
    if (!confirm(t('confirmDelete', { name: boxName }))) {
      return;
    }

    setDeletingId(boxId);

    try {
      const res = await fetch(`/api/admin/boxes/${boxId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('failedDelete'));
      }

      setBoxes((prevBoxes) => prevBoxes.filter((box) => box.id !== boxId));

      addToast({
        title: tc('success'),
        description: t('boxDeleted'),
      });

      router.refresh();
    } catch (error) {
      addToast({
        title: tc('error'),
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (boxes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#8888aa] mb-4">{t('noBoxes')}</p>
        <Button asChild>
          <Link href="/admin/boxes/create">{t('createFirst')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {boxes.map((box) => (
        <Card key={box.id} className="border-[rgba(255,255,255,0.06)] bg-[#12123a]">
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-white">{box.name}</CardTitle>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                box.isActive 
                  ? 'bg-[#C84FFF]/20 text-[#E879F9]' 
                  : 'bg-red-500/20 text-red-500'
              }`}>
                {box.isActive ? t('active') : t('inactive')}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-[#8888aa]">{box.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#8888aa]">{tc('price')}: {box.price} {t('coins')}</span>
                <span className="text-sm text-[#8888aa]">{box.cardsPerPack} {t('cardsPerPack')}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/admin/boxes/${box.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    {tc('edit')}
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(box.id, box.name)}
                  disabled={deletingId === box.id}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deletingId === box.id ? tc('deleting') : tc('delete')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

