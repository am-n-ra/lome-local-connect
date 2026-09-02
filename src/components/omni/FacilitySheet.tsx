import type { MapFacility } from "@/components/omni/MapCanvas";
import { FacilityPanel } from "@/components/omni/FacilityPanel";
import { OmniSheet } from "@/components/omni/ui/OmniPrimitives";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { haversineKm } from "@/lib/omni";

type Props = {
  facility: MapFacility | null;
  origin: { lat: number; lng: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routingBusy?: boolean;
  onItinerary?: () => void;
  onCheckAvailability?: () => void;
  transactionAccessGranted?: boolean;
};

export function FacilitySheet({
  facility,
  origin,
  open,
  onOpenChange,
  routingBusy,
  onItinerary,
  onCheckAvailability,
  transactionAccessGranted = false,
}: Props) {
  const navigate = useNavigate();

  if (!facility) return null;

  return (
    <OmniSheet
      open={open}
      onOpenChange={onOpenChange}
      title={facility.name}
      {...(facility.address ? { description: facility.address } : {})}
      footer={
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate({ to: "/fiche/$id", params: { id: facility.id } })}
        >
          Page complète
        </Button>
      }
    >
      <FacilityPanel
        facility={facility}
        distanceKm={haversineKm(origin, {
          lat: facility.latitude,
          lng: facility.longitude,
        })}
        routingBusy={routingBusy}
        onItinerary={onItinerary}
        transactionAccessGranted={transactionAccessGranted}
        onCheckAvailability={onCheckAvailability}
      />
    </OmniSheet>
  );
}
