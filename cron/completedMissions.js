import cron from "node-cron";
import missionController from "../controllers/mission";
import { getStyleLog } from "../utils";

export default async () => {
  cron.schedule("0 0 2 * * *", async () => {
    let missions = [];

    try {
      missions = await missionController.findIncompletes();
      await missions.map(async mission => {
        await missionController.completeMission(mission);
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
