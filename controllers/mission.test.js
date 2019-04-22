import controller from "./mission";
import {
  messageWithMission,
  messageWithMissionToAnotherUser
} from "../mocks/rocket";
import { missionAccepted, missionNotAccepted } from "../mocks/missions";
import userController from "./user";
import minerController from "./miner";
import { user } from "../mocks/user";
import { quiz } from "../mocks/miner/quiz";
import * as utils from "../utils/missions";
jest.mock("./user");

describe("Mission Controller", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("commandIndex", () => {
    it("should call 'create' function on ask mission to his own", done => {
      const spy = jest
        .spyOn(controller, "create")
        .mockImplementationOnce(() => Promise.resolve(missionAccepted));

      controller.commandIndex(messageWithMission).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(res).toEqual(missionAccepted);
        done();
      });
    });

    it("should call 'create' function on ask mission to another user", done => {
      const spy = jest
        .spyOn(controller, "create")
        .mockImplementationOnce(() => Promise.resolve(missionNotAccepted));

      controller.commandIndex(messageWithMissionToAnotherUser).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(res).toEqual(missionNotAccepted);
        done();
      });
    });
  });

  describe("create", () => {
    userController.findByOrigin = jest.fn().mockImplementationOnce(() => user);

    it("should return a new mission accepted on ask mission to his own", done => {
      utils.sendedToAnotherUser = jest.fn().mockImplementationOnce(() => false);

      const spy = jest
        .spyOn(controller, "createToSameUser")
        .mockImplementationOnce(() => Promise.resolve(missionAccepted));

      controller.create(messageWithMission).then(res => {
        expect(userController.findByOrigin).toHaveBeenCalled();
        expect(utils.sendedToAnotherUser).toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
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
      userController.findByOrigin = jest
        .fn()
        .mockImplementationOnce(() => user);

      utils.sendedToAnotherUser = jest.fn().mockImplementationOnce(() => true);

      const spy = jest
        .spyOn(controller, "createToAnotherUser")
        .mockImplementationOnce(() => Promise.resolve(missionNotAccepted));

      controller.create(messageWithMission).then(res => {
        expect(userController.findByOrigin).toHaveBeenCalled();
        expect(utils.sendedToAnotherUser).toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
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

      controller.createToSameUser(messageWithMission).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(spyQuiz).toHaveBeenCalled();
        expect(spySave).toHaveBeenCalled();
        expect(res).toEqual("Uhuul! Sua nova missão foi criada! :)");
        done();
      });
    });
  });

  describe("createToAnotherUser", () => {
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

      controller.createToSameUser(messageWithMission).then(res => {
        expect(spy).toHaveBeenCalled();
        expect(spyQuiz).toHaveBeenCalled();
        expect(spySave).toHaveBeenCalled();
        expect(res).toEqual("Uhuul! Sua nova missão foi criada! :)");
        done();
      });
    });
  });
});
