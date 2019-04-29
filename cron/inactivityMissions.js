import cron from "node-cron";
import missionController from "../controllers/mission";
import { getStyleLog } from "../utils";

export default async () => {
  cron.schedule("0 0 0 * * *", async () => {
    let missions = [];

    try {
      missions = await missionController.findInactivities();

      missions.map(mission => {
        mission.refusedDate = Date.now();
        mission.save();
      });
    } catch (e) {
      console.log(
        getStyleLog("red"),
        `\n-- error updating inactivity missions`
      );
      return false;
    }

    return true;
  });
};
