import controller from "./mission";
import model from "../models/mission";
import {
  messageWithMission,
  messageWithMissionToAnotherUser,
  messageWithAnswerMissionRefused,
  messageWithAnswerMissionAccepted
} from "../mocks/rocket";
import { missionAccepted, missionNotAccepted } from "../mocks/missions";
import userController from "./user";
import minerController from "./miner";
import { user } from "../mocks/user";
import { quiz } from "../mocks/miner/quiz";
import * as utils from "../utils/missions";
import * as rocket from "../rocket/bot";

describe("Mission Controller", () => {
  const acceptedData = {
    reaction: "accepted",
    researchHash: missionAccepted._id
  };

  const refusedData = {
    reaction: "refused",
    researchHash: missionAccepted._id
  };

  afterEach(() => jest.restoreAllMocks());

  describe("commandIndex", () => {
    it("should call 'create' function on ask mission to his own", done => {
      const response = {
        text: "Uhuul! Sua nova missão foi criada! :muscle:"
      };

      const spy = jest
        .spyOn(controller, "create")
        .mockImplementationOnce(() => Promise.resolve(response));

      const spySendMessage = jest
        .spyOn(rocket, "sendToUser")
        .mockImplementationOnce(() => Promise.resolve(true));

      controller.commandIndex(messageWithMission).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(spySendMessage).toHaveBeenCalled();
        expect(res).toHaveProperty("text");
        expect(res).toEqual(response);
        done();
      });
    });

    it("should call 'create' function on ask mission to another user", done => {
      const username = messageWithMissionToAnotherUser.u.username;
      const response = {
        text: `Uhuul! Uma nova missão foi enviada para @${username}! :muscle:`
      };

      const spy = jest
        .spyOn(controller, "create")
        .mockImplementationOnce(() => Promise.resolve(response));

      const spySendMessage = jest
        .spyOn(rocket, "sendToUser")
        .mockImplementationOnce(() => Promise.resolve(true));

      controller.commandIndex(messageWithMissionToAnotherUser).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(spySendMessage).toHaveBeenCalled();
        expect(res).toHaveProperty("text");
        expect(res).toEqual(response);
        done();
      });
    });
  });

  describe("create", () => {
    it("should return a new mission accepted on ask mission to his own", done => {
      const spy = jest
        .spyOn(userController, "findByOrigin")
        .mockImplementationOnce(() => user);

      const spySended = jest
        .spyOn(utils, "sendedToAnotherUser")
        .mockImplementationOnce(() => false);

      const spyCreate = jest
        .spyOn(controller, "createToSameUser")
        .mockImplementationOnce(() => Promise.resolve(missionAccepted));

      controller.create(messageWithMission).then(res => {
        expect(userController.findByOrigin).toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
        expect(spySended).toHaveBeenCalled();
        expect(spyCreate).toHaveBeenCalled();
        expect(res).toHaveProperty("text");
        expect(res.text).toHaveProperty("_id");
        expect(res.text).toHaveProperty("accepted", true);
        expect(res.text).toHaveProperty("acceptedDate");
        expect(res.text).toHaveProperty("kindId");
        expect(res.text.kindId).not.toBeNull();
        done();
      });
    });

    it("should return a new mission accepted on ask mission to another user", done => {
      const spy = jest
        .spyOn(userController, "findByOrigin")
        .mockImplementationOnce(() => user);

      const spySended = jest
        .spyOn(utils, "sendedToAnotherUser")
        .mockImplementationOnce(() => true);

      const spyCreate = jest
        .spyOn(controller, "createToAnotherUser")
        .mockImplementationOnce(() => Promise.resolve(missionNotAccepted));

      controller.create(messageWithMissionToAnotherUser).then(res => {
        expect(userController.findByOrigin).toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
        expect(spySended).toHaveBeenCalled();
        expect(spyCreate).toHaveBeenCalled();
        expect(res).toHaveProperty("text");
        expect(res.text).toHaveProperty("_id");
        expect(res.text).toHaveProperty("accepted", false);
        expect(res.text).not.toHaveProperty("acceptedDate");
        expect(res.text).toHaveProperty("kindId");
        expect(res.text.kindId).toBeNull();
        done();
      });
    });
  });

  describe("createToSameUser", () => {
    it("should return a error message", done => {
      const spy = jest
        .spyOn(utils, "userAbleToReceiveNewMission")
        .mockImplementationOnce(() => Promise.resolve(false));

      controller.createToSameUser(messageWithMission).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(res).toEqual(
          "Ops! Você não pode mais receber nenhuma missão por enquanto. :("
        );
        done();
      });
    });

    it("should return a success message", done => {
      const spy = jest
        .spyOn(utils, "userAbleToReceiveNewMission")
        .mockImplementationOnce(() => Promise.resolve(true));

      const spyQuiz = jest
        .spyOn(minerController, "getNewQuiz")
        .mockImplementationOnce(() => Promise.resolve(quiz));

      const spySave = jest
        .spyOn(controller, "save")
        .mockImplementationOnce(() => Promise.resolve(missionAccepted));

      controller.createToSameUser(user).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(spyQuiz).toHaveBeenCalled();
        expect(spySave).toHaveBeenCalled();
        expect(res).toEqual("Uhuul! Sua nova missão foi criada! :muscle:");
        done();
      });
    });
  });

  describe("createToAnotherUser", () => {
    it("should return a error message", done => {
      const spy = jest
        .spyOn(utils, "getSenderUsername")
        .mockImplementationOnce(() => "mary");

      const spyReceiver = jest
        .spyOn(utils, "getReceiverByUsername")
        .mockImplementationOnce(() => Promise.resolve(user));

      const spyAbled = jest
        .spyOn(utils, "userAbleToReceiveNewMission")
        .mockImplementationOnce(() => Promise.resolve(false));

      const spyGenerateMessage = jest
        .spyOn(utils, "generateMessage")
        .mockImplementationOnce(() => "Mensagem");

      const spySendMessage = jest
        .spyOn(rocket, "sendToUser")
        .mockImplementationOnce(() => Promise.resolve(true));

      const spySave = jest
        .spyOn(controller, "save")
        .mockImplementationOnce(() => Promise.resolve(missionNotAccepted));

      controller
        .createToAnotherUser(user, messageWithMissionToAnotherUser)
        .then(res => {
          expect(spy).toHaveBeenCalled();
          expect(spyReceiver).toHaveBeenCalled();
          expect(spyAbled).toHaveBeenCalled();
          expect(spyGenerateMessage).not.toHaveBeenCalled();
          expect(spySendMessage).not.toHaveBeenCalled();
          expect(spySave).not.toHaveBeenCalled();
          expect(res).toEqual(
            "Ops! Este guerreiro(a) não pode receber mais missões. :("
          );
          done();
        });
    });

    it("should return a success message", done => {
      const spy = jest
        .spyOn(utils, "getSenderUsername")
        .mockImplementationOnce(() => "mary");

      const spyReceiver = jest
        .spyOn(utils, "getReceiverByUsername")
        .mockImplementationOnce(() => Promise.resolve(user));

      const spyAbled = jest
        .spyOn(utils, "userAbleToReceiveNewMission")
        .mockImplementationOnce(() => Promise.resolve(true));

      const spyGenerateMessage = jest
        .spyOn(utils, "generateMessage")
        .mockImplementationOnce(() => "Mensagem");

      const spySendMessage = jest
        .spyOn(rocket, "sendToUser")
        .mockImplementationOnce(() => Promise.resolve(true));

      const spySave = jest
        .spyOn(controller, "save")
        .mockImplementationOnce(() => Promise.resolve(missionNotAccepted));

      controller
        .createToAnotherUser(user, messageWithMissionToAnotherUser)
        .then(res => {
          expect(spy).toHaveBeenCalled();
          expect(spyReceiver).toHaveBeenCalled();
          expect(spyAbled).toHaveBeenCalled();
          expect(spyGenerateMessage).toHaveBeenCalled();
          expect(spySendMessage).toHaveBeenCalled();
          expect(spySave).toHaveBeenCalled();
          expect(res).toEqual(
            "Uhuul! Uma nova missão foi enviada para @mary! :muscle:"
          );
          done();
        });
    });
  });

  describe("answer", () => {
    it("should return undefined to invalid message", done => {
      const spy = jest
        .spyOn(utils, "convertToMissionData")
        .mockImplementationOnce(() => undefined);

      controller.answer(messageWithAnswerMissionRefused).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(res).toBeUndefined();
        done();
      });
    });

    it("should return undefined to empty reaction", done => {
      const data = JSON.parse(JSON.stringify(acceptedData));
      data.reaction = null;

      const spy = jest
        .spyOn(utils, "convertToMissionData")
        .mockImplementationOnce(() => data);

      controller.answer(messageWithAnswerMissionRefused).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(res).toBeUndefined();
        done();
      });
    });

    it("should return undefined to empty researchHash", done => {
      const data = JSON.parse(JSON.stringify(acceptedData));
      data.researchHash = null;

      const spy = jest
        .spyOn(utils, "convertToMissionData")
        .mockImplementationOnce(() => data);

      controller.answer(messageWithAnswerMissionRefused).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(res).toBeUndefined();
        done();
      });
    });

    it("should return error message to invalid reaction", done => {
      const data = JSON.parse(JSON.stringify(acceptedData));
      data.reaction = "atena";

      const spy = jest
        .spyOn(utils, "convertToMissionData")
        .mockImplementationOnce(() => data);

      controller.answer(messageWithAnswerMissionRefused).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(res).toHaveProperty("text");
        expect(res.text).toEqual(
          "Responda com :+1: para aceitar e :-1: para recusar."
        );
        done();
      });
    });

    it("should return error message to not founded mission", done => {
      const spy = jest
        .spyOn(utils, "convertToMissionData")
        .mockImplementationOnce(() => acceptedData);

      const spyFind = jest
        .spyOn(model, "find")
        .mockImplementationOnce(() => Promise.resolve(false));

      controller.answer(messageWithAnswerMissionRefused).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(spyFind).toHaveBeenCalled();
        expect(res).toHaveProperty("text");
        expect(res.text).toEqual(
          "Ops! Não conseguimos encontrar sua missão. :("
        );
        done();
      });
    });

    it("should return error message to already accepted mission", done => {
      const spy = jest
        .spyOn(utils, "convertToMissionData")
        .mockImplementationOnce(() => acceptedData);

      const spyFind = jest
        .spyOn(model, "find")
        .mockImplementationOnce(() => Promise.resolve(missionAccepted));

      controller.answer(messageWithAnswerMissionRefused).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(spyFind).toHaveBeenCalled();
        expect(res).toHaveProperty("text");
        expect(res.text).toEqual("Você já respondeu a esse desafio! :)");
        done();
      });
    });

    it("should return error message to already refused mission", done => {
      const spy = jest
        .spyOn(utils, "convertToMissionData")
        .mockImplementationOnce(() => acceptedData);

      const mission = JSON.parse(JSON.stringify(missionAccepted));
      mission.refusedDate = mission.acceptedDate;
      delete mission.acceptedDate;

      const spyFind = jest
        .spyOn(model, "find")
        .mockImplementationOnce(() => Promise.resolve(mission));

      controller.answer(messageWithAnswerMissionAccepted).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(spyFind).toHaveBeenCalled();
        expect(res).toHaveProperty("text");
        expect(res.text).toEqual("Você já respondeu a esse desafio! :)");
        done();
      });
    });

    it("should return error message to daily limit exceeded", done => {
      const spy = jest
        .spyOn(utils, "convertToMissionData")
        .mockImplementationOnce(() => acceptedData);

      const spyFind = jest
        .spyOn(model, "find")
        .mockImplementationOnce(() => Promise.resolve(missionNotAccepted));

      const spyLimit = jest
        .spyOn(utils, "isInDailyLimit")
        .mockImplementationOnce(() => Promise.resolve(false));

      controller.answer(messageWithAnswerMissionRefused).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(spyFind).toHaveBeenCalled();
        expect(spyLimit).toHaveBeenCalled();
        expect(res).toHaveProperty("text");
        expect(res.text).toEqual(
          "Poxa, já tem 2 missão ativas. Finalize as missões anteriores para poder participar de novas. :("
        );
        done();
      });
    });

    it("should return error message to outdated limit", done => {
      const spy = jest
        .spyOn(utils, "convertToMissionData")
        .mockImplementationOnce(() => acceptedData);

      const spyFind = jest
        .spyOn(model, "find")
        .mockImplementationOnce(() => Promise.resolve(missionNotAccepted));

      const spyLimit = jest
        .spyOn(utils, "isInDailyLimit")
        .mockImplementationOnce(() => Promise.resolve(true));

      const spyLimitDate = jest
        .spyOn(utils, "isInLimitDate")
        .mockImplementationOnce(() => false);

      controller.answer(messageWithAnswerMissionRefused).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(spyFind).toHaveBeenCalled();
        expect(spyLimit).toHaveBeenCalled();
        expect(spyLimitDate).toHaveBeenCalled();
        expect(res).toHaveProperty("text");
        expect(res.text).toEqual(
          "Que pena, já passou a data limite para entrar nessa missão. :("
        );
        done();
      });
    });

    it("should return success message to accepted reaction", done => {
      const spy = jest
        .spyOn(utils, "convertToMissionData")
        .mockImplementationOnce(() => acceptedData);

      const spyFind = jest
        .spyOn(model, "find")
        .mockImplementationOnce(() => Promise.resolve(missionNotAccepted));

      const spyLimit = jest
        .spyOn(utils, "isInDailyLimit")
        .mockImplementationOnce(() => Promise.resolve(true));

      const spyLimitDate = jest
        .spyOn(utils, "isInLimitDate")
        .mockImplementationOnce(() => true);

      const spyAccepted = jest
        .spyOn(utils, "isAcceptedAnswer")
        .mockImplementationOnce(() => true);

      const spyRefused = jest
        .spyOn(utils, "isRefusedAnswer")
        .mockImplementationOnce(() => false);

      const spyQuiz = jest
        .spyOn(minerController, "getNewQuiz")
        .mockImplementationOnce(() => Promise.resolve(quiz));

      const spyAccept = jest
        .spyOn(controller, "acceptMission")
        .mockImplementationOnce(() => Promise.resolve(true));

      controller.answer(messageWithAnswerMissionRefused).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(spyFind).toHaveBeenCalled();
        expect(spyLimit).toHaveBeenCalled();
        expect(spyLimitDate).toHaveBeenCalled();
        expect(spyAccepted).toHaveBeenCalled();
        expect(spyQuiz).toHaveBeenCalled();
        expect(spyAccept).toHaveBeenCalled();
        expect(spyRefused).not.toHaveBeenCalled();
        expect(res).toHaveProperty("text");
        expect(res.text).toEqual(
          "Oba, missão foi aceita! :) \n Aguarde sua enquete chegará em breve."
        );
        done();
      });
    });

    it("should return success message to refused reaction", done => {
      const spy = jest
        .spyOn(utils, "convertToMissionData")
        .mockImplementationOnce(() => refusedData);

      const spyFind = jest
        .spyOn(model, "find")
        .mockImplementationOnce(() => Promise.resolve(missionNotAccepted));

      const spyLimit = jest
        .spyOn(utils, "isInDailyLimit")
        .mockImplementationOnce(() => Promise.resolve(true));

      const spyLimitDate = jest
        .spyOn(utils, "isInLimitDate")
        .mockImplementationOnce(() => true);

      const spyAccepted = jest
        .spyOn(utils, "isAcceptedAnswer")
        .mockImplementationOnce(() => false);

      const spyRefused = jest
        .spyOn(utils, "isRefusedAnswer")
        .mockImplementationOnce(() => true);

      const spyRefuse = jest
        .spyOn(controller, "refuseMission")
        .mockImplementationOnce(() => Promise.resolve(true));

      controller.answer(messageWithAnswerMissionRefused).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(spyFind).toHaveBeenCalled();
        expect(spyLimit).toHaveBeenCalled();
        expect(spyLimitDate).toHaveBeenCalled();
        expect(spyAccepted).toHaveBeenCalled();
        expect(spyRefused).toHaveBeenCalled();
        expect(spyRefuse).toHaveBeenCalled();
        expect(res).toHaveProperty("text");
        expect(res.text).toEqual(
          "Que pena que não deseja participar dessa luta. \n Mas quando mudar de ideia, só enviar *!missao* que te enviamos uma missão novinha! ;)"
        );
        done();
      });
    });
  });
});
