define(['app'], function(app) {


  describe("App", function() {
    it("should be defined", function() {
      expect(app).toBeDefined();
    });
    it("should have a renderQuiz method", function() {
      expect(app.renderQuiz).toBeDefined();
    });
  });

  describe("jQuery", function() {
    it("should exist", function() {
      expect(window.jQuery).toBeTruthy();
    });
  });


});


