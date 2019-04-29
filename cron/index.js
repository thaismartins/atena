import cronUsersInactivity from "./inactivity";
import inactivityAchievements from "./inactivityAchievements";
import inactivityMissions from "./inactivityMissions";
import cronRanking from "./ranking";
import cronWorkers from "./workers";

export default () => {
  cronUsersInactivity();
  cronRanking();
  inactivityAchievements();
  inactivityMissions();
  cronWorkers();
};
