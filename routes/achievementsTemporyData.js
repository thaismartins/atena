import express from "express";
import bodyParser from "body-parser";
import achievementTemporaryDataController from "../controllers/achievementTemporaryData";
import userController from "../controllers/user";

const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/test", async (req, res) => {
  const data = {
    uuid: "555d245e-bde6-487d-b15e-0fbcce43ac46",
    fullname: "Vicente Ribeiro",
    email: "vicenteribeiro@teste.com",
    network_email: "vicente-ribeiro@impulser.me",
    cpf: null,
    gender: null,
    languages: { spanish: "none", english: "intermediary" },
    location: { city: null, state: "Distrito Federal", country: null },
    rocket_chat: {
      id: "YuERYwRhdCowht3Fp",
      username: "vicente-ribeiro",
      last_login_at: null
    },
    bank_account: {},
    skills: [
      {
        label: "QA - Testes de Performance",
        macro_area: "QA",
        value: "37.0",
        skill_value: 1,
        experience_time: "Mais de 8 anos"
      },
      {
        label: "QA - Testes Automatizados",
        macro_area: "QA",
        value: "37.0",
        skill_value: 2,
        experience_time: "Mais de 8 anos"
      },
      {
        label: "QA - Estratégia e Planejamento de Testes",
        macro_area: "QA",
        value: "37.0",
        skill_value: 3,
        experience_time: "Mais de 8 anos"
      },
      {
        label: "QA - Testes Manuais",
        macro_area: "QA",
        value: "37.0",
        skill_value: 4,
        experience_time: "Mais de 8 anos"
      }
    ],
    referrer: {
      type: "impulser",
      uuid: "55df21ff-6893-4e28-aaaa-70c3260585d1"
    },
    impulso_on_linkedin: false,
    linkedin: { uid: "V9P5mh38Rh" },
    projects: [],
    opportunities_feed: [
      {
        date: "2019-01-31T15:23:08.941-02:00",
        uuid: "81f84bc6-39bf-4b56-a734-cc89f391bb52",
        title: "M4U - Agile Coach",
        status: "interview"
      },
      {
        date: "2019-03-27T11:57:15.120-03:00",
        uuid: "089ce260-72d6-420d-b0fc-fc2eb2b5927c",
        title: "Impulso - Back-ender Ruby (Pleno)",
        status: "interested"
      }
    ],
    created_at: "2019-02-28T01:32:22.431Z",
    maturity_levels: [
      { area: "Geral", level: 2 },
      { area: "Backend", level: 0 },
      { area: "Frontend", level: 0 },
      { area: "Mobile", level: 0 },
      { area: "Design", level: 0 },
      { area: "Gestão", level: 0 },
      { area: "QA", level: 2 },
      { area: "Infra", level: 0 }
    ],
    current_plan: null
  };

  let achievementsTemporaryData = await userController.handleFromNext(data);
  res.json(achievementsTemporaryData);
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
