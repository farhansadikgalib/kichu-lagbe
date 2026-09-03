import { getDeliveryCharge } from "@/lib/db/queries/settings";
import { handleApiError, ok } from "@/lib/api/response";

/** Public delivery terms shown at checkout. */
export async function GET() {
  try {
    return ok({ charge: await getDeliveryCharge() });
  } catch (err) {
    return handleApiError(err);
  }
}
