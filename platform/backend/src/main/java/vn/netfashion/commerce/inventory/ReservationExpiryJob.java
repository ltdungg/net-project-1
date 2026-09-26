package vn.netfashion.commerce.inventory;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReservationExpiryJob {
    private final InventoryService inventory;

    public ReservationExpiryJob(InventoryService inventory) {
        this.inventory = inventory;
    }

    @Scheduled(
        fixedDelayString = "${app.reservation-expiry-scan-ms:60000}",
        initialDelayString = "${app.reservation-expiry-initial-delay-ms:30000}"
    )
    public void releaseExpiredReservations() {
        inventory.releaseExpiredSystem();
    }
}
