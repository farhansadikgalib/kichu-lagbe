import { requireUser } from "@/lib/auth/guards";
import { getDeliveryCharge, setDeliveryCharge } from "@/lib/db/queries/settings";
import { deliverySettingsSchema } from "@/lib/validation/catalog";
import { handleApiError, ok } from "@/lib/api/response";

export async function GET() {
  try {
    await requireUser("admin");
    return ok({ charge: await getDeliveryCharge() });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireUser("admin");
    const input = deliverySettingsSchema.parse(await request.json());
    return ok({ charge: await setDeliveryCharge(input.charge) });
  } catch (err) {
    return handleApiError(err);
  }
}
