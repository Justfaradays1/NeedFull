import cron from "node-cron";
import db, { withTransaction } from "../config/db";
import { refundEscrow } from "../services/wallet.service";
import { notifyUser } from "../services/notification.service";
import { expireProposals } from "../services/proposal.service";

export function initCronJobs() {
  console.log("Initializing cron jobs...");

  // Expire tasks that have passed their deadline and are still open
  // Run every hour
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("[Cron] Running expired tasks cleanup...");
      const result = await db.query(`
        UPDATE tasks 
        SET status = 'cancelled', updated_at = NOW()
        WHERE status = 'open' AND deadline < NOW()
        RETURNING id, poster_id, escrow_amount_kobo, budget_kobo, title
      `);
      
      for (const row of result.rows) {
        // Refund escrow if any was locked (escrow == budget for open tasks)
        const escrowKobo = row.escrow_amount_kobo ?? row.budget_kobo;
        await withTransaction(async (client) => {
          await refundEscrow(client, row.poster_id, escrowKobo, row.id);
        });

        await notifyUser(row.poster_id, {
          type: "task_expired",
          title: "Task Expired",
          body: `Your task "${row.title}" expired without being accepted. The budget has been refunded.`,
          taskId: row.id,
        });
      }
      
      if (result.rowCount && result.rowCount > 0) {
        console.log(`[Cron] Cancelled and refunded ${result.rowCount} expired tasks.`);
      }
    } catch (error) {
      console.error("[Cron] Error processing expired tasks:", error);
    }
  });

  // Expire budget proposals that were never answered (PENDING → EXPIRED)
  // Run every 30 minutes — proposal lifetime is 24h
  cron.schedule("*/30 * * * *", async () => {
    try {
      console.log("[Cron] Running budget proposal expiry...");
      const expired = await expireProposals();
      if (expired > 0) {
        console.log(`[Cron] Expired ${expired} budget proposals.`);
      }
    } catch (error) {
      console.error("[Cron] Error expiring proposals:", error);
    }
  });

  // Additional MVP cron jobs can be added here
}
