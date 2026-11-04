const BRIDGE = 'http://127.0.0.1:3847';
const EXT_ID = process.env.NEXT_PUBLIC_CARDMARKET_EXTENSION_ID?.trim() ?? '';

export type AutomateResult = { success: boolean; cartUrl?: string; error?: string; message?: string };

/** Trigger local Cardmarket cart automation (extension → bridge → real Chrome CDP). */
export function runCardmarketAutomation(orderId: string): Promise<AutomateResult> {
  return new Promise((resolve) => {
    const fallback = () => {
      const tab = window.open(
        `${BRIDGE}/fill/${encodeURIComponent(orderId)}`,
        '_blank',
        'noopener,noreferrer'
      );
      if (!tab) {
        resolve({
          success: false,
          error: `Pop-up blocked. Allow pop-ups or open ${BRIDGE}/fill/${orderId}`,
        });
        return;
      }
      resolve({
        success: true,
        message: 'Running in local tab — wait until it says Cart ready.',
      });
    };

    const chromeRuntime = (
      globalThis as typeof globalThis & {
        chrome?: {
          runtime?: {
            sendMessage: (
              id: string,
              msg: unknown,
              cb: (res: AutomateResult) => void
            ) => void;
            lastError?: { message: string };
          };
        };
      }
    ).chrome?.runtime;

    if (chromeRuntime?.sendMessage && EXT_ID) {
      chromeRuntime.sendMessage(EXT_ID, { type: 'FULFILL_ORDER', orderId }, (res) => {
        if (chromeRuntime.lastError) {
          fallback();
          return;
        }
        resolve(res ?? { success: false, error: 'No response from extension' });
      });
      return;
    }

    fallback();
  });
}
