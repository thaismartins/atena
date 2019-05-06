import express from "express";
import bodyParser from "body-parser";
import achievementTemporaryDataController from "../controllers/achievementTemporaryData";
import missionController from "../controllers/mission";
import { sendedToAnotherUser } from "../utils/missions";
import { messageWithAnswerMissionAccepted } from "../mocks/rocket";
// import interactionController from "../controllers/interaction";

const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post("/test", async (req, res) => {
  // const message = {
  //   _id: "9iu48nfao3xPWLrkp",
  //   rid: "GENERAL",
  //   msg: "!missao @thais.martins",
  //   ts: { $date: 1551699287633 },
  //   _updatedAt: { $date: 1551699287653 },
  //   u: {
  //     _id: "EbMkCCoJzqrNf9uzK",
  //     username: "atena-thais-bot",
  //     name: "Atena Thais Bot"
  //   },
  //   mentions: [
  //     {
  //       _id: "2GcRwb7Hh4pwTFf8q",
  //       name: "Thais Martins",
  //       username: "thais.martins"
  //     }
  //   ],
  //   channels: [],
  //   origin: "rocket",
  //   reactions: {
  //     ":+1:": { usernames: ["atena-thais-bot", "thais.martins"] },
  //     ":-1:": { usernames: ["atena-thais-bot", "thais.martins"] },
  //     ":atena:": { usernames: ["thais.martins"] },
  //     ":grinning:": { usernames: ["thais.martins"] },
  //     ":money_mouth:": { usernames: ["thais.martins"] }
  //   },
  //   researchHash: "5cbe79b34d984f76bd4e86fb"
  // };

  // let user = await missionController.answer(message);

  // const message = {
  //   origin: "rocket",
  //   category: "network",
  //   channel: "4eS6cTjteeAPWgQbf",
  //   date: "3/25/2019, 5:24:23 PM",
  //   type: "reaction_added",
  //   description: ":+1:",
  //   parentUser: "TszkAS88ABu8iPJLY",
  //   user: "2GcRwb7Hh4pwTFf8q",
  //   action: "reaction",
  //   score: 1,
  //   researchHash: "5cbbce6c8180335a624d4b59"
  // };
  // let user = await missionController.answer(message);

  const message = {
    _id: "KxhvJmgGfiWSG6i6o",
    rid: "Aa6fSXib23WpHjof7",
    msg: "!missao @thais-martins ",
    ts: { $date: 1557159131684 },
    u: { _id: "FnFyDTAmCPevRBY9n", username: "emir", name: "Emir Segundo ⚔️" },
    _updatedAt: { $date: 1557159131724 },
    mentions: [
      {
        _id: "JygChQDBtQX5FpvaY",
        name: "Thais Martins",
        username: "thais-martins"
      }
    ],
    channels: [],
    origin: "rocket"
  };

  let mission = await missionController.create(message);
  res.json(mission);
});

router.get("/", async (req, res) => {
  let achievementsTemporaryData = await achievementTemporaryDataController.getAll();
  res.json(achievementsTemporaryData);
});

router.get("/:id", async (req, res) => {
  let achievementTemporaryData = await achievementTemporaryDataController.getById(
    req.params.id
  );
  res.json(achievementTemporaryData);
});

router.post("/", async (req, res) => {
  let achievementsTemporaryData = await achievementTemporaryDataController.save(
    req.body
  );
  res.json(achievementsTemporaryData);
});

router.put("/:id", async (req, res) => {
  let achievementTemporaryData = await achievementTemporaryDataController.update(
    req.params.id,
    req.body
  );
  res.json(achievementTemporaryData);
});

router.delete("/:id", async (req, res) => {
  let achievementTemporaryData = await achievementTemporaryDataController.disable(
    req.params.id
  );
  res.json(achievementTemporaryData);
});

export default router;
