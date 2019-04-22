import controller from "./miner";
import { user } from "../mocks/user";
import { quiz } from "../mocks/miner/quiz";

describe.only("Miner Controller", () => {
  describe("getNewQuiz", () => {
    it("should return a object quiz", done => {
      controller.getNewQuiz(user).then(res => {
        expect(res).toEqual(quiz);
        done();
      });
    });
  });
});
