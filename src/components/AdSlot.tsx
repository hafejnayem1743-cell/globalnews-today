import React, { useEffect, useRef } from 'react';

interface AdSlotProps {
  type?: 'banner' | 'native';
  className?: string;
  slotId?: string;
}

const BANNER_KEY = 'e24d1097435dcb1f8835935bd6daa2f4';
const NATIVE_ID = '0ad12195c7a8017872b3c168add41965';

export const AdSlot: React.FC<AdSlotProps> = ({ type = 'banner', className = '', slotId = 'default' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const nativeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type !== 'banner' || !ref.current) return;
    const holder = ref.current;
    if (holder.dataset.loaded === '1') return;
    const script = document.createElement('script');
    script.text = `atOptions = { 'key' : '${BANNER_KEY}', 'format' : 'iframe', 'height' : 90, 'width' : 728, 'params' : {} };`;
    holder.appendChild(script);
    const invoke = document.createElement('script');
    invoke.src = `https://www.highrevenueformat.com/${BANNER_KEY}/invoke.js`;
    invoke.async = true;
    holder.appendChild(invoke);
    holder.dataset.loaded = '1';
  }, [type, slotId]);

  useEffect(() => {
    if (type !== 'native' || !nativeRef.current || nativeRef.current.dataset.loaded === '1') return;
    const holder = nativeRef.current;
    const script = document.createElement('script');
    script.src = `https://pl31422628.profitableratecpmnetwork.com/${NATIVE_ID}/invoke.js`;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    holder.appendChild(script);
    holder.dataset.loaded = '1';
  }, [type, slotId]);

  if (type === 'banner') {
    return (
      <div className={`w-full my-5 ${className}`} aria-label="Advertisement">
        <div className="mx-auto max-w-full overflow-x-auto px-1 sm:px-2">
          <div className="min-w-[728px] w-[728px] mx-auto rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden">
            <div className="text-center text-[9px] uppercase tracking-[0.2em] text-stone-400 py-1">Advertisement</div>
            <div ref={ref} id={`ad-banner-${slotId}`} className="h-[90px] w-[728px] flex items-center justify-center bg-stone-50 dark:bg-stone-950" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full my-6 ${className}`} aria-label="Advertisement">
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm p-3 sm:p-4">
        <div className="text-[9px] uppercase tracking-[0.2em] text-stone-400 mb-2">Advertisement</div>
        <div ref={nativeRef} id={`container-${NATIVE_ID}`} className="min-h-[120px] w-full overflow-hidden" />
      </div>
    </div>
  );
};
