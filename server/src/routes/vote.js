const express = require('express');
const router = express.Router();

const Answer = require('../models/Answer');

router.post('/vote', async function (req, res, next) {
    if(!req.user){
        res.status(401);
        res.json({success: false, error: "Not logged in"});
        return;
    }
    const answerId = parseInt(req.body.answer);
    const questionId = parseInt(req.body.question);
    const upvote = req.body.upvote === "true";

    if (isNaN(answerId) || isNaN(questionId)) {
        res.status(400);
        res.json({success: false, error: "Bad Input"});
        return;
    }
    const answer = new Answer(answerId);
    const qaId = await answer.getQaId(questionId);
    if (!qaId) {
        res.status(422);
        res.json({success: false, error: "Unable To Find Q-A Pair"});
        return;
    }
    await req.user.vote(qaId, upvote);
    res.json({success: true, error: ""});
});

router.post('/unvote', async function (req, res, next) {
    if(!req.user){
        res.status(401);
        res.json({success: false, error: "Not logged in"});
        return;
    }

    const answerId = parseInt(req.body.answer);
    const questionId = parseInt(req.body.question);

    if (isNaN(answerId) || isNaN(questionId)) {
        res.status(400);
        res.json({success: false, error: "Bad Input"});
        return;
    }
    const answer = new Answer(answerId);
    const qaId = await answer.getQaId(questionId);
    if (!qaId) {
        res.status(422);
        res.json({success: false, error: "Unable To Find Q-A Pair"});
        return;
    }
    await req.user.removeVote(qaId);
    res.json({success: true, error: ""});
});

module.exports = router;