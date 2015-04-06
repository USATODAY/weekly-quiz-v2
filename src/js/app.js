define(
    [
        'jquery',
        'api/analytics'
    ],
    function(jQuery, Analytics) {

        var quiz = quiz || {};

        quiz.init = function() {

            var blnIframeEmbed = window != window.parent;

            if (blnIframeEmbed) {
                $("body").addClass("iFrame");
                $("#header").hide();
                $(".mobile-footer-link").hide();
                $(".article-button").hide();
            }
            quiz.objBody = jQuery("body");
            quiz.objQuizContainer = jQuery(".quiz-container");
            quiz.objData = {};
            quiz.arrNumQuizQuestions = [];
            quiz.arrNumQuizCorrect = [];
            quiz.arrQuizDone = [];
            quiz.arrResultsText = [];
            quiz.arrResultsRange = [];
            quiz.arrResultsShare = [];
            quiz.arrShareTitles = [];
            quiz.arrGenericShares = [];
            quiz.currentQuiz = 0;
            quiz.currentQuestion = 0;
            quiz.blnAllDone = false;
            quiz.objShareBox = jQuery(".share-copy");
            quiz.strBackgroundURL = "";
            quiz.staticInfo = [];
            quiz.staticSection = jQuery(".staticinfo");
            quiz.blnIsSingle = false;
            quiz.blnUseContext = false;
            quiz.blnShowAnswer = false;
            quiz.blnTimer = false;
            quiz.numTimerValue = 30; //in seconds
            quiz.numCountdown = quiz.numTimerValue;
            quiz.numIntervalId = 0;
            quiz.quizName = "";
            if (quiz.staticSection.length > 0) {
                quiz.staticInfo = JSON.parse(quiz.staticSection.html());
            } else {
                quiz.staticInfo = JSON.parse('{"platform": "desktop", "facebook": {"channel_url": "//www.usatoday.com/static/html/channel.html", "app_id": "215046668549694"}, "ads": {"account": "usatoday"}, "share_url": "http://www.usatoday.com/pages/interactives/weekly-quiz-dev/"}');
            }
            quiz.platform = quiz.staticInfo.platform;
            quiz.fbAppId = quiz.staticInfo.facebook.app_id;
            quiz.adsAccount = quiz.staticInfo.ads.account;

            if (quiz.platform == "mobile") {
                quiz.objBG = quiz.objBody;
            } else {
                quiz.objBG = jQuery(".asset").eq(0);
            }
            quiz.dataHandler();

            
            window.addEventListener("orientationchange", function() {
                quiz.checkOrientation();
                quiz.resizeImg();
            }, false);

        };

        quiz.dataHandler = function() {
            var strHash = document.location.hash;
            if ((strHash) && (strHash !== "") && (strHash !== "#")) {
                var arrParams = strHash.split("/");
                if (arrParams[0] === "#week") {
                    window.data_url = "http://www.gannett-cdn.com/experiments/usatoday/2015/quizzes/" + arrParams[1] + "/" + "week" + arrParams[2] + "/data.json";
                    quiz.quizName = "week" + arrParams[2] + arrParams[1];
                } else if (arrParams[0] === "#data") {
                    window.data_url = "http://www.gannett-cdn.com/experiments" + strHash.replace("#data", "") + "data.json";
                    quiz.quizName = arrParams[arrParams.length - 3] + ":" + arrParams[arrParams.length - 2];
                } else {
                    window.data_url = strHash.replace("#custom/", "");
                    quiz.quizName = arrParams[arrParams.length - 3] + ":" + arrParams[arrParams.length - 2];
                }
            }
            Analytics.trackEvent("quiz:" + quiz.quizName);
            quiz.loadData();
        };


        quiz.getParameterByName = function(name) {
            var match = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
            return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
        };

        quiz.loadData = function() {
            var hostname = window.location.hostname;
            var strURL = window.data_url;

            if (hostname != "localhost") {

                jQuery.getJSON("http://" + hostname + "/services/webproxy/?url=" + strURL, function(data) {
                    quiz.objData = data;
                    if (data[0].params[0].single_image_quiz.toUpperCase() == "TRUE") {
                        quiz.blnIsSingle = true;
                        console.log("single = true");
                    }
                    if (data[0].params[0].use_context.toUpperCase() == "TRUE") {
                        quiz.blnUseContext = true;
                        console.log("context = true");
                    }
                    if (data[0].params[0].show_answer.toUpperCase() == "TRUE") {
                        quiz.blnShowAnswer = true;
                        console.log("answer = true");
                    }
                    if (data[0].params[0].use_timer.toUpperCase() == "TRUE") {
                        quiz.blnTimer = true;
                        console.log("timer = true");
                    }
                    quiz.renderQuiz();
                    window.setTimeout(function() {
                        $(".preloader-mobile").eq(0).fadeOut(500);
                    }, 1000);
                });
            } else {
                jQuery.getJSON('/js/data/data.json', function(data) {
                    quiz.objData = data;
                    if (data[0].params[0].single_image_quiz.toUpperCase() == "TRUE") {
                        quiz.blnIsSingle = true;
                        console.log("single = true");
                    }
                    if (data[0].params[0].use_context.toUpperCase() == "TRUE") {
                        quiz.blnUseContext = true;
                        console.log("context = true");
                    }
                    if (data[0].params[0].show_answer.toUpperCase() == "TRUE") {
                        quiz.blnShowAnswer = true;
                        console.log("answer = true");
                    }
                    if (data[0].params[0].use_timer.toUpperCase() == "TRUE") {
                        quiz.blnTimer = true;
                        console.log("timer = true");
                    }
                    quiz.renderQuiz();
                    window.setTimeout(function() {
                        $(".preloader-mobile").eq(0).fadeOut(500);
                    }, 1000);
                });
                

                onresize = function() {
                    
                    quiz.checkOrientation();
                    quiz.resizeImg();
                };
            }
        };

        quiz.renderQuiz = function() {
            var i;
            var strHTMLIntro = "";
            var strHTMLQuizzes = "";
            strHTMLIntro += '<div class="intro active">';
            quiz.numTotalQuizzes = quiz.objData.length;

            var strSVGCheck = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 66.7 70" enable-background="new 0 0 66.7 70" xml:space="preserve"> <path d="M24.8,70c-2.2,0-4.2-1-5.6-2.8L1.4,43.6c-2.3-3.1-1.7-7.4,1.3-9.8c3.1-2.3,7.4-1.7,9.8,1.3l11.8,15.5L53.8,3.3 c2-3.3,6.3-4.3,9.6-2.2c3.3,2,4.3,6.3,2.2,9.6L30.8,66.7c-1.2,1.9-3.3,3.2-5.6,3.3C25.1,70,24.9,70,24.8,70z"/></svg>';
            var strSVGX = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 63.1 69.8" enable-background="new 0 0 63.1 69.8" xml:space="preserve"><path d="M60.7,56L42.2,34.9l18.5-21.1c3.1-3.1,3.1-8.2,0-11.4c-3.1-3.1-8.2-3.1-11.4,0L31.5,22.7L13.7,2.4c-3.1-3.1-8.2-3.1-11.4,0 c-3.1,3.1-3.1,8.2,0,11.4l18.5,21.1L2.4,56c-3.1,3.1-3.1,8.2,0,11.4c3.1,3.1,8.2,3.1,11.4,0l17.8-20.3l17.8,20.3 c3.1,3.1,8.2,3.1,11.4,0C63.9,64.3,63.9,59.2,60.7,56z"/></svg>';
            var strSVGRightArrow = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 62.2 97" enable-background="new 0 0 62.2 97" xml:space="preserve"><polygon fill="#FFFFFF" points="13.7,0 0,13.7 34.8,48.5 0,83.3 13.7,97 62.2,48.5 "/></svg>'
            jQuery.each(quiz.objData, function(index) {
                strHTMLIntro += '<div class="intro-panel" style="height: ' + (100 / quiz.numTotalQuizzes).toString() + '%;">';
                if (!quiz.blnIsSingle) {
                    strHTMLIntro += '    <div class="background"><div class="intro-background-overlay"></div><img src="' + quiz.objData[index].params[0].base_path + quiz.objData[index].params[0].background + '" class="intro-image"/></div>';
                }
                strHTMLIntro += '    <div class="label"><h3>' + quiz.objData[index].params[0].label + '</h3>';
                strHTMLIntro += '    <p class="sub-label">' + quiz.objData[index].params[0].sub_label + '</p></div>';
                strHTMLIntro += '</div>';

                strHTMLQuizzes += '<div class="quiz ' + quiz.objData[index].section + ' upcoming">';
                strHTMLQuizzes += '    <div class="question-progress-bar"><div class="question-progress-inner"><span class="next-question-button-text">Next question</span> <span class="next-question-button-arrow">' + strSVGRightArrow + '</span></div></div>';
                strHTMLQuizzes += '    <div class="question-number">1/10</div>';
                
                strHTMLQuizzes += '    <div class="quiz-intro active">';
                if (!quiz.blnIsSingle) {
                    strHTMLQuizzes += '        <div class="intro-image"><img src="' + quiz.objData[index].params[0].base_path + quiz.objData[index].questions[quiz.objData[index].questions.length - 1].image + '" /></div>';
                }
                strHTMLQuizzes += '        <div class="intro-label">';
                strHTMLQuizzes += '            <h2>' + quiz.objData[index].params[0].label + '</h2>';
                strHTMLQuizzes += '        </div>';
                if (quiz.objData[index].params[0].sponsor_photo !== "") {
                    strHTMLQuizzes += '        <div class="sponsor-image"><img src="' + quiz.objData[index].params[0].base_path + quiz.objData[index].params[0].sponsor_photo + '" /></div>';
                }
                if (quiz.objData[index].params[0].sponsor_text !== "") {
                    strHTMLQuizzes += '        <div class="sponsor-text">' + quiz.objData[index].params[0].sponsor_text + '</div>';
                }
                strHTMLQuizzes += '    </div>';
                quiz.arrNumQuizQuestions[index] = quiz.objData[index].questions.length;
                quiz.arrNumQuizCorrect[index] = 0;
                quiz.arrQuizDone[index] = false;
                quiz.arrShareTitles[index] = quiz.objData[index].params[0].title;
                quiz.arrGenericShares[index] = quiz.objData[index].params[0].generic_share;
                jQuery.each(quiz.objData[index].questions, function(qindex) {
                    strHTMLQuizzes += '    <div class="question-panel upcoming ' + quiz.objData[index].questions[qindex].type + ' ' + quiz.objData[index].questions[qindex].section + '">';
                    strHTMLQuizzes += '        <div class="question-content upcoming">';
                    strHTMLQuizzes += '            <div class="question-text">' + quiz.objData[index].questions[qindex].value + '</div>';
                    if (quiz.blnTimer) {
                        strHTMLQuizzes += '            <div class="question-response show">0:30<div class="quiz-question-timer-sub">seconds left</div></div>';
                    } else {
                        strHTMLQuizzes += '            <div class="question-response"></div>';
                    }
                    strHTMLQuizzes += '            <div class="question-buttons">';
                    jQuery.each(quiz.objData[index].questions[qindex].answers, function(aindex) {
                        strHTMLQuizzes += '            <div class="answer">';
                        if (quiz.objData[index].questions[qindex].answers[aindex].image !== "") {
                            strHTMLQuizzes += '                <div class="outer-image-wrap"><div class="image-wrap"><img src="' + quiz.objData[index].params[0].base_path + quiz.objData[index].questions[qindex].answers[aindex].image + '" /></div>';
                        }
                        if (quiz.objData[index].questions[qindex].answers[aindex].correct.toLowerCase() == "x") {
                            strHTMLQuizzes += '                <div class="answer-response-image correct">' + strSVGCheck + '</div>';
                        } else {
                            strHTMLQuizzes += '                <div class="answer-response-image wrong">' + strSVGX + '</div>';
                        }
                        if (quiz.objData[index].questions[qindex].answers[aindex].image !== "") {
                            strHTMLQuizzes += '            </div>';
                        }
                        strHTMLQuizzes += '                <span class="answer-text">' + quiz.objData[index].questions[qindex].answers[aindex].answer + '</span>';
                        strHTMLQuizzes += '            </div>';
                    });
                    strHTMLQuizzes += '            </div>';
                    strHTMLQuizzes += '            <div class="question-context">' + quiz.objData[index].questions[qindex].context + '</div>';
                    strHTMLQuizzes += '        </div>';
                    if (!quiz.blnIsSingle) {
                    strHTMLQuizzes += '        <div class="question-image"><div class="img-overlay"></div><img src="' + quiz.objData[index].params[0].base_path + quiz.objData[index].questions[qindex].image + '" /></div>';
                    }
                    strHTMLQuizzes += '    </div>';

                });
                strHTMLQuizzes += '    <div class="results-panel upcoming">';
                strHTMLQuizzes += '        <div class="results-content">';
                strHTMLQuizzes += '        <div class="results-text"></div>';
                strHTMLQuizzes += '        </div>';
                strHTMLQuizzes += '        <div class="quiz-share-button"><h4 class="next-text">Share</h4></div>';
                strHTMLQuizzes += '        <div class="intro-button"><h4 class="next-text">Home</h4></div>';
                strHTMLQuizzes += '        <div class="social-buttons"> <a href="" class="social-link" id="twitter-share"> <img src="http://www.gannett-cdn.com/experiments/usatoday/2014/12/year-end-quiz/img/twitter.svg" alt="twitter" class="social-icon"></a>';
                strHTMLQuizzes += '        <a href="" class="social-link"><img src="http://www.gannett-cdn.com/experiments/usatoday/2014/12/year-end-quiz/img/fb.svg" alt="twitter" class="social-icon"></a>';
                strHTMLQuizzes += '        <a href="" class="social-link" id="email-share"><img src="http://www.gannett-cdn.com/experiments/usatoday/2014/12/year-end-quiz/img/email.svg" alt="email" class="social-icon"></a></div>';
                if (quiz.objData[index].params[0].credit) {
                    strHTMLQuizzes += '        <div class="credit">' + quiz.objData[index].params[0].credit + '</div>';
                }
                strHTMLQuizzes += '    </div>';

                strHTMLQuizzes += '</div>';
            });

            if (quiz.blnIsSingle) {
                strHTMLQuizzes += '        <div class="single-image"><img src="' + quiz.objData[0].params[0].base_path + quiz.objData[0].questions[0].image + '" /></div>';
            } 
           
            strHTMLIntro += '</div>';
            quiz.objQuizContainer.append(strHTMLIntro + strHTMLQuizzes);

            quiz.strBackgroundURL = quiz.objData[0].params[0].base_path + quiz.objData[0].params[0].start_back;
            quiz.checkOrientation();

            quiz.setParams();
            quiz.resizeImg();
        };

        quiz.setParams = function() {
            quiz.objMainIntro = jQuery(".intro");
            quiz.arrQuizzes = jQuery(".quiz");
            quiz.arrMainIntroPanels = jQuery(".intro-panel");
            quiz.arrQuizIntros = jQuery(".quiz-intro");
            quiz.arrQuizResults = jQuery(".results-panel");
            quiz.arrQuizNext = jQuery(".next-button");
            quiz.arrQuizHome = jQuery(".intro-button");
            quiz.arrQuizLabels = jQuery(".label");
            quiz.arrQuizSubLabels = jQuery(".sub-label");
            quiz.arrShareShowButtons = jQuery(".quiz-share-button");
            quiz.arrShareCloseButtons = jQuery(".share-close-button");
            quiz.arrProgressBars = jQuery(".question-progress-inner");
            quiz.objProgressSection = jQuery(".question-progress-bar");
            quiz.objQuestionNumber = jQuery(".question-number");
            quiz.arrQuestionButtons = jQuery(".question-buttons");
            quiz.arrQuestionContext = jQuery(".question-context");
            quiz.arrImageOverlays = jQuery(".img-overlay");
            quiz.arrFullImgs = jQuery(".question-image").add(".intro-image").add(".single-image").find("img");
            if (quiz.numTotalQuizzes < 2) {
                quiz.arrShareButtons = quiz.arrQuizResults.eq(0).find("a");
                
                quiz.arrFullImgs = jQuery(".question-image").add(".intro-image").add(".intro-panel").add(".single-image").find("img");
                quiz.objQuizContainer.addClass("single");
                quiz.arrQuizIntros.removeClass("active").addClass("done");
                quiz.objMainIntro.append("<div class='play-button'><h3>Begin</h3></div>");
                quiz.objPlayButton = jQuery(".play-button");
                quiz.arrQuestions = quiz.arrQuizzes.eq(quiz.currentQuiz).find(".question-panel");
                quiz.arrQuestions.eq(quiz.currentQuestion).removeClass("upcoming").addClass("active");
            } else {
                quiz.arrSharePanel = jQuery(".share-page");
                quiz.arrShareButtons = quiz.arrSharePanel.find("a");
            }
            quiz.addEventListeners();
        };

        quiz.addEventListeners = function() {

            if (quiz.numTotalQuizzes < 2) {
                quiz.objPlayButton.click(function(e) {
                    quiz.currentQuiz = 0;
                    if (!quiz.arrQuizDone[quiz.currentQuiz]) {
                        quiz.currentQuestion = 0;
                        quiz.objMainIntro.removeClass("active").addClass("done");
                        quiz.arrQuizzes.eq(quiz.currentQuiz).removeClass("upcoming").addClass("active");
                        quiz.strBackgroundURL = quiz.objData[quiz.currentQuiz].params[0].base_path + quiz.objData[quiz.currentQuiz].background;
                        quiz.checkOrientation();
                        Analytics.trackEvent('Play button click');
                        setTimeout(quiz.startQuiz, 1500);
                    }
                });
            } else {
                quiz.arrMainIntroPanels.click(function(e) {
                    quiz.currentQuiz = quiz.arrMainIntroPanels.index(this);
                    if (!quiz.arrQuizDone[quiz.currentQuiz]) {
                        quiz.currentQuestion = 0;
                        quiz.objMainIntro.removeClass("active").addClass("done");
                        quiz.arrQuizzes.eq(quiz.currentQuiz).removeClass("upcoming").addClass("active");
                        quiz.strBackgroundURL = quiz.objData[quiz.currentQuiz].params[0].base_path + quiz.objData[quiz.currentQuiz].background;
                        quiz.checkOrientation();
                        Analytics.trackEvent('Intro panel quiz click');
                        setTimeout(quiz.startQuiz, 1500);
                    }
                });
            }

            quiz.arrQuizHome.click(function(e) {
                quiz.arrQuizzes.eq(quiz.currentQuiz).removeClass("active").addClass("done");
                quiz.objMainIntro.removeClass("done").addClass("active");
                if (quiz.blnAllDone) {
                    quiz.strBackgroundURL = quiz.objData[0].params[0].base_path + quiz.objData[0].params[0].start_back;
                    Analytics.trackEvent('Show intro panel');
                    quiz.checkOrientation();
                }
            });

            quiz.arrQuizNext.click(function(e) {
                Analytics.trackEvent('Next quiz click');
                quiz.nextQuiz();
            });


            quiz.arrShareShowButtons.click(function(e) {
                quiz.arrSharePanel.eq(0).addClass("show");
                quiz.objQuizContainer.addClass("blur");
                Analytics.trackEvent('Show share panel');
            });

            quiz.arrShareCloseButtons.click(function(e) {
                quiz.arrSharePanel.eq(0).removeClass("show");
                quiz.objQuizContainer.removeClass("blur");
                Analytics.trackEvent('Hide share panel');
            });

            $(window).resize(function(e) {
                quiz.resizeImg();
                quiz.checkOrientation();
            });

            quiz.arrShareButtons.eq(0).click(function(e) {
                Analytics.trackEvent('Twitter share');
            });

            quiz.arrShareButtons.eq(1).click(function(e) {
                Analytics.trackEvent('Facebook share');
            });

            quiz.arrShareButtons.eq(2).click(function(e) {
                Analytics.trackEvent('Email share');
            });

            quiz.objProgressSection.click(function(e) {
                quiz.nextQuestion();
                Analytics.trackEvent('Next question clicked');
            });
        };

        quiz.startQuiz = function() {
            if (quiz.blnIsSingle) {
                $(".single-image").addClass("blur");
            }
            var strShareHead, strShareChatter, strFBURL;
            var strPageURL = document.location.href;
            quiz.arrQuestions = quiz.arrQuizzes.eq(quiz.currentQuiz).find(".question-panel");
            quiz.arrQuizIntros.eq(quiz.currentQuiz).removeClass("active").addClass("done");
            quiz.objShareBox.html(quiz.arrGenericShares[quiz.currentQuiz]);
            strShareHead = quiz.arrShareTitles[quiz.currentQuiz];
            strShareChatter = quiz.arrGenericShares[quiz.currentQuiz];
            strShareHead = strShareHead.replace("'", "\\'");
            strShareChatter = strShareChatter.replace("'", "\\'");
            strPageURL = strPageURL.replace("#", "%23");
            strFBURL = "http://" + document.location.host + "/pages/interactives/fb-share/";
            quiz.arrShareButtons.eq(1).attr({
                "onclick": "var sTop=window.screen.height/2-(218);var sLeft=window.screen.width/2-(313);window.open('https://www.facebook.com/dialog/feed?display=popup&app_id=" + quiz.fbAppId + "&link=" + strPageURL + "&picture=" + quiz.objData[quiz.currentQuiz].params[0].base_path + "fb-post.jpg&name=" + strShareHead + "&description=" + strShareChatter + "&redirect_uri=" + strFBURL + "','sharer','toolbar=0,status=0,width=580,height=400,top='+sTop+',left='+sLeft);void(0);"
            });
            quiz.arrShareButtons.eq(0).attr({
                "onclick": "window.open('https://twitter.com/intent/tweet?url=" + strPageURL + "&text=" + strShareHead + ": " + strShareChatter + "&via=usatoday', 'twitterwindow', 'height=450, width=550, top=200, left=200, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0');void(0);"
            });
            quiz.arrShareButtons.eq(2).attr({
                "href": "mailto:?body=" + quiz.arrGenericShares[quiz.currentQuiz] + " %0d%0d " + encodeURIComponent(strPageURL) + "&subject=" + quiz.arrShareTitles[quiz.currentQuiz]
            });

            quiz.nextQuestion();
        };

        quiz.nextQuestion = function() {
            var quizPercentComplete = quiz.currentQuestion / quiz.arrNumQuizQuestions[quiz.currentQuiz];
            //quiz.arrProgressBars.eq(quiz.currentQuiz).css("transform", ("scaleX(" + quizPercentComplete + ")"));
            quiz.objProgressSection.removeClass("show");
            quiz.objQuestionNumber.removeClass("show");
            if (quiz.currentQuestion < quiz.arrNumQuizQuestions[quiz.currentQuiz]) {
                quiz.arrProgressBars.removeClass().addClass("question-progress-inner " + quiz.objData[quiz.currentQuiz].questions[quiz.currentQuestion].section);
                quiz.arrQuestions.eq(quiz.currentQuestion).removeClass("upcoming").addClass("active");
                quiz.objImagePanel = quiz.arrQuestions.eq(quiz.currentQuestion).find(".question-image");
                quiz.objQuestionContent = quiz.arrQuestions.eq(quiz.currentQuestion).find(".question-content");
                quiz.arrAnswers = quiz.arrQuestions.eq(quiz.currentQuestion).find(".answer");
                quiz.objResponse = quiz.arrQuestions.eq(quiz.currentQuestion).find(".question-response");
                jQuery.each(quiz.objData[quiz.currentQuiz].questions[quiz.currentQuestion].answers, function(aindex) {
                    if (quiz.objData[quiz.currentQuiz].questions[quiz.currentQuestion].answers[aindex].correct !== "") {
                        quiz.correctAnswer = aindex;
                        return false;
                    }
                });
                jQuery.each(quiz.objData[quiz.currentQuiz].results, function(rindex) {
                    quiz.arrResultsText[rindex] = quiz.objData[quiz.currentQuiz].results[rindex].text;
                    quiz.arrResultsRange[rindex] = parseInt(quiz.objData[quiz.currentQuiz].results[rindex].range);
                    quiz.arrResultsShare[rindex] = quiz.objData[quiz.currentQuiz].results[rindex].share_text;
                });
                setTimeout(quiz.renderQuestion, 2000);
            } else {
                quiz.arrProgressBars.removeClass().addClass("question-progress-inner");
                quiz.objQuestionContent.removeClass("active").addClass("done");
                quiz.renderResults();
            }
            if ((quiz.currentQuestion !== 0) && (quiz.currentQuestion < quiz.arrNumQuizQuestions[quiz.currentQuiz])) {
                quiz.arrQuestions.eq(quiz.currentQuestion - 1).removeClass("active").addClass("done");
            }
        };

        quiz.renderQuestion = function() {
            quiz.objImagePanel.addClass("blur");

            quiz.objQuestionContent.removeClass("upcoming").addClass("active");
            if ((quiz.blnTimer) && (quiz.blnShowAnswer)) {
                quiz.objResponse.addClass("show");
                quiz.numIntervalId = setInterval(quiz.renderTime, 1000);
            }
            quiz.arrAnswers.one("click", function(e) {
                if ((quiz.blnTimer) && (quiz.blnShowAnswer)) {
                    clearInterval(quiz.numIntervalId);
                    quiz.numCountdown = quiz.numTimerValue;
                }
                quiz.renderAnswer(quiz.arrAnswers.index(this));
            });
        };

        quiz.renderTime = function() {
            var numMinutes = Math.floor(quiz.numCountdown / 60);
            var numSeconds = quiz.numCountdown % 60;
            var strTime = "";
/*
            if (numMinutes > 1) {
                strTime = numMinutes.toString() + ":" + (quiz.numCountdown % 60).toString();
            } else {
                strTime = ":" + (quiz.numCountdown % 60).toString();
            }
*/
            if (numSeconds < 10) {
                strTime = numMinutes.toString() + ":0" + (quiz.numCountdown % 60).toString();
            } else {
                strTime = numMinutes.toString() + ":" + (quiz.numCountdown % 60).toString();
            }
            strTime += "<div class='quiz-question-timer-sub'>seconds left</div>";

            if (quiz.numCountdown > 0){
                quiz.objResponse.html(strTime);
            } else {
                clearInterval(quiz.numIntervalId);
                quiz.numCountdown = quiz.numTimerValue;
                quiz.objResponse.html("Times up!");
                quiz.renderAnswer(-1);
            }
            quiz.numCountdown = quiz.numCountdown - 1;
        };

        quiz.renderAnswer = function(intSelected) {
            if (intSelected !== -1) {
                if (intSelected !== quiz.correctAnswer) {
                    if (quiz.blnShowAnswer) {
                        quiz.objResponse.html("wrong!");
                        quiz.arrAnswers.eq(intSelected).addClass("wrong").addClass("selected");
                        quiz.arrAnswers.eq(quiz.correctAnswer).addClass("correct");
                    }
                } else {
                    if (quiz.blnShowAnswer) {
                        quiz.objResponse.html("correct!");
                        quiz.arrAnswers.eq(quiz.correctAnswer).addClass("correct").addClass("selected");
                    }
                    quiz.arrNumQuizCorrect[quiz.currentQuiz] = quiz.arrNumQuizCorrect[quiz.currentQuiz] + 1;
                }
            } else {
                quiz.arrAnswers.eq(quiz.correctAnswer).addClass("correct");
            }
            quiz.objResponse.addClass("show");
            if (quiz.blnShowAnswer) {
                if (quiz.blnUseContext) {
                    setTimeout(quiz.renderContext, 2000);
                } else {
                    quiz.currentQuestion = quiz.currentQuestion + 1;
                    setTimeout(quiz.nextQuestion, 2000);
                }
            } else {
                if (quiz.blnUseContext) {
                    quiz.renderContext();
                } else {
                    quiz.currentQuestion = quiz.currentQuestion + 1;
                    quiz.nextQuestion();
                }
            }
        };

        quiz.renderContext = function() {
            var strSVGRightArrow = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 62.2 97" enable-background="new 0 0 62.2 97" xml:space="preserve"><polygon fill="#FFFFFF" points="13.7,0 0,13.7 34.8,48.5 0,83.3 13.7,97 62.2,48.5 "/></svg>'
            quiz.arrQuestionButtons.eq(quiz.currentQuestion).addClass("hide");
            quiz.arrQuestionContext.eq(quiz.currentQuestion).addClass("show");
            quiz.objQuestionNumber.text((quiz.currentQuestion + 1).toString() + "/" + quiz.arrNumQuizQuestions[quiz.currentQuiz].toString());
            quiz.objProgressSection.addClass("show");
            quiz.objQuestionNumber.addClass("show");
            quiz.arrImageOverlays.eq(quiz.currentQuestion).addClass("dark");
            quiz.currentQuestion = quiz.currentQuestion + 1;
            if (quiz.currentQuestion >= quiz.arrNumQuizQuestions[quiz.currentQuiz]) {
                quiz.arrProgressBars.html('<span class="next-question-button-text">Results</span> <span class="next-question-button-arrow">' + strSVGRightArrow + '</span>');
            }
       };

        quiz.renderResults = function() {
            var strResultsText, strShareText;
            jQuery.each(quiz.arrResultsRange, function(rindex) {
                if ((quiz.arrNumQuizCorrect[quiz.currentQuiz] <= quiz.arrResultsRange[rindex]) || (quiz.arrNumQuizCorrect[quiz.currentQuiz] >= quiz.arrResultsRange[quiz.arrResultsRange.length - 1])) {
                    if (quiz.arrNumQuizCorrect[quiz.currentQuiz] <= quiz.arrResultsRange[rindex]) {
                        if (quiz.blnShowAnswer) {
                            strResultsText = "<div class='results-text-inner-wrap'><h3 class='result-header'>You got " + quiz.arrNumQuizCorrect[quiz.currentQuiz].toString() + " out of " + quiz.arrNumQuizQuestions[quiz.currentQuiz].toString() + " correct!</h3> <p>" + quiz.arrResultsText[rindex] + "</p></div>";
                            strShareText = "I got " + quiz.arrNumQuizCorrect[quiz.currentQuiz].toString() + " out of " + quiz.arrNumQuizQuestions[quiz.currentQuiz].toString() + " correct! " + quiz.arrResultsShare[rindex];
                        } else {
                            strResultsText = "<div class='results-text-inner-wrap'><p>" + quiz.arrResultsText[rindex] + "</p></div>";
                            strShareText = quiz.arrResultsShare[rindex];
                        }
                    } else {
                        if (quiz.blnShowAnswer) {
                            strResultsText = "<div class='results-text-inner-wrap'><h3 class='result-header'>You got " + quiz.arrNumQuizCorrect[quiz.currentQuiz].toString() + " out of " + quiz.arrNumQuizQuestions[quiz.currentQuiz].toString() + " correct!</h3> <p>" + quiz.arrResultsText[quiz.arrResultsRange.length - 1] + "</p></div>";
                            strShareText = "I got " + quiz.arrNumQuizCorrect[quiz.currentQuiz].toString() + " out of " + quiz.arrNumQuizQuestions[quiz.currentQuiz].toString() + " correct! " + quiz.arrResultsShare[quiz.arrResultsRange.length - 1];
                        } else {
                            strResultsText = "<div class='results-text-inner-wrap'><p>" + quiz.arrResultsText[quiz.arrResultsRange.length - 1] + "</p></div>";
                            strShareText = quiz.arrResultsShare[quiz.arrResultsRange.length - 1];
                        }
                    }
                    return false;
                }
            });

            var strShareHead, strShareChatter, strFBURL;
            var strPageURL = document.location.href;
            strShareHead = quiz.arrShareTitles[quiz.currentQuiz];
            strShareChatter = strShareText;
            strShareHead = strShareHead.replace("'", "\\'");
            strShareChatter = strShareChatter.replace("'", "\\'");
            strPageURL = strPageURL.replace("#", "%23");
            strFBURL = "http://" + document.location.host + "/pages/interactives/fb-share/";
            quiz.arrShareButtons.eq(1).attr({
                "onclick": "var sTop=window.screen.height/2-(218);var sLeft=window.screen.width/2-(313);window.open('https://www.facebook.com/dialog/feed?display=popup&app_id=" + quiz.fbAppId + "&link=" + strPageURL + "&picture=" + quiz.objData[quiz.currentQuiz].params[0].base_path + "fb-post.jpg&name=" + strShareHead + "&description=" + strShareChatter + "&redirect_uri=" + strFBURL + "','sharer','toolbar=0,status=0,width=580,height=400,top='+sTop+',left='+sLeft);void(0);"
            });
            quiz.arrShareButtons.eq(0).attr({
                "onclick": "window.open('https://twitter.com/intent/tweet?url=" + strPageURL + "&text=" + strShareChatter + "&via=usatoday', 'twitterwindow', 'height=450, width=550, top=200, left=200, toolbar=0, location=0, menubar=0, directories=0, scrollbars=0');void(0);"
            });
            quiz.arrShareButtons.eq(2).attr({
                "href": "mailto:?body=" + strShareText + " %0d%0d " + encodeURIComponent(strPageURL) + "&subject=" + quiz.arrShareTitles[quiz.currentQuiz]
            });


            quiz.arrQuizResults.eq(quiz.currentQuiz).find(".results-text").html(strResultsText);
            quiz.arrQuizLabels.eq(quiz.currentQuiz).parent().addClass("finished");
            quiz.arrQuizLabels.eq(quiz.currentQuiz).removeClass("label").addClass("final-results-text").html(strResultsText);
            quiz.objShareBox.html(strShareText);
            quiz.arrQuizResults.eq(quiz.currentQuiz).removeClass("upcoming").addClass("active");
            quiz.arrQuizDone[quiz.currentQuiz] = true;
            jQuery.each(quiz.arrQuizDone, function(findex) {
                if (!quiz.arrQuizDone[findex]) {
                    quiz.numNextQuiz = findex;
                    quiz.blnAllDone = false;
                    return false;
                } else {
                    quiz.blnAllDone = true;
                }
            });
            if (quiz.blnAllDone) {
                quiz.arrQuizNext.eq(quiz.currentQuiz).html("<h4 class='next-text'>Final results</h4>");
            } else {
                quiz.arrQuizNext.eq(quiz.currentQuiz).addClass(quiz.objData[quiz.numNextQuiz].section);
            }
        };

        quiz.nextQuiz = function() {
            quiz.arrQuizzes.eq(quiz.currentQuiz).removeClass("active").addClass("done");
            if (!quiz.blnAllDone) {
                quiz.arrQuizzes.eq(quiz.numNextQuiz).removeClass("upcoming").addClass("active");
                quiz.currentQuiz = quiz.numNextQuiz;
                quiz.strBackgroundURL = quiz.objData[quiz.currentQuiz].params[0].base_path + quiz.objData[quiz.currentQuiz].background;
                quiz.checkOrientation();
                quiz.currentQuestion = 0;
                setTimeout(quiz.startQuiz, 2000);
            } else {
                quiz.objMainIntro.removeClass("done").addClass("active");
                quiz.strBackgroundURL = quiz.objData[0].params[0].base_path + quiz.objData[0].params[0].start_back;
                quiz.checkOrientation();
            }
        };

        quiz.resizeImg = function() {
            var natRatio = 750 / 1334;
            var contWidth = quiz.objQuizContainer.width();
            var contHeight = quiz.objQuizContainer.height();
            var actualRatio = contWidth / contHeight;
            if (actualRatio > natRatio) {
                quiz.arrFullImgs.addClass("wide").removeClass("tall");
            } else {
                quiz.arrFullImgs.addClass("tall").removeClass("wide");
            }
        };

        quiz.checkOrientation = function() {
            var winWidth = window.innerWidth;
            var winHeight = window.innerHeight;
            if (winWidth < 415 || winHeight < 415   ) {
                if (winWidth > winHeight) {
                    quiz.objBody.addClass("landscape");
                } else {
                    quiz.objBody.removeClass("landscape");
                }
            }
            if (winWidth > 540) {
                // quiz.objBG.css({
                //     'background': 'url(http://www.gannett-cdn.com/static/usat-web-static-746.0/images/patterns/noise_f6f6f6.png) top left #f6f6f6'
                // });
            }
            /*if (quiz.platform === "desktop") {
                quiz.objQuizContainer.css({"top": "40px", "min-height": (winHeight - 40).toString() + "px"});
            } else {
                quiz.objQuizContainer.css({"top": "50px", "min-height": (winHeight - 50).toString() + "px"});
            } */
        };
        return quiz;
    });
