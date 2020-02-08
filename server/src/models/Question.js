const conn = require('../database/postges.js').pool;
const TimeAgo = require('javascript-time-ago');

const Answer = require('../models/Answer');
const markdown = require('../helpers/markdown');

TimeAgo.addLocale(require('javascript-time-ago/locale/en'));

const timeAgo = new TimeAgo('en-US');

class Question {
    constructor(id) {
        this.id = id;
    }

    async init() {
        const {row} = await conn.singleRow('SELECT creator_id, creator_username, title, created,last_modified, tag_string, score, answers, solutions FROM question WHERE id = $1', [this.id]);
        if (!row) {
            return;
        }
        this._setAttributes(row);
    }

    static async FromId(id) {
        const question = new Question(id);
        await question.init();
        return question;
    }

    static async getTitle(id) {
        const {row} = await conn.singleRow('SELECT title FROM question WHERE id = $1', [id]);
        if (!row) {
            return;
        }
        return row.title;
    }

    async fillContent() {
        const {row} = await conn.singleRow('SELECT content FROM question WHERE id = $1', [this.id]);
        this.content =  row.content;
        this.renderedContent = markdown.render(this.content)
    }

    getCreatedFriendlyTimeAgo() {
        return timeAgo.format(this.created);
    }

    getModifiedFriendlyTimeAgo() {
        return timeAgo.format(this.last_modified);
    }

    _setAttributes(obj) {
        this.creator = {
            id: obj.creator_id,
            username: obj.creator_username,
        };
        this.title = obj.title;
        this.last_modified = obj.last_modified;
        this.solutions = obj.solutions;
        this.answers = obj.answers;
        this.score = obj.score;
        this.created = obj.created;
        if (obj.hasOwnProperty("taglist")) {
            this.taglist = obj.taglist;
        } else {
            this.taglist = obj.tag_string ? Array.from(obj.tag_string.matchAll(/<([^ >]+)>/g)).map(arr => arr[1]) : [];
        }
    }

    static async getQuestions(siteid, limit = 20, offset = 0) {
        const {rows} = await conn.multiRow("SELECT id, creator_id, creator_username, title, created, last_modified, tag_string, score, answers, solutions FROM question WHERE site_id = $1 AND deleted = FALSE ORDER BY last_modified DESC LIMIT $2 OFFSET  $3", [siteid, limit, offset]);
        return rows.map(row => {
            const question = new Question(row.id);
            question._setAttributes(row);
            return question;
        });
    }

    async getAnswers(siteid, page = 1, orderby, perpage = 30) {
        const orderbyWhite = {
            "newest": "answers.created",
            "links": ""
        };
        if (!orderbyWhite.hasOwnProperty(orderby)) {
            return [];
        }
        const {rows: answers} = await conn.multiRow(`SELECT * FROM questions_join_answers INNER JOIN answers ON questions_join_answers.answer_id = answers.id WHERE questions_join_answers.question_id = $1 AND deleted = FALSE ORDER BY ${orderbyWhite[orderby]} DESC LIMIT $2 OFFSET $3`, [this.id, perpage, (page - 1) * perpage]);
        return answers.map(answer => {
            const answer2 = new Answer(answer.id);
            answer2._setAttributes(answer);
            if(answer.answer_is_solution){
                answer2.is_solution = true;
            }
            return answer2;
        });
    }

    static async create(title, body, tags, siteid, creator){
        const {row} = await conn.singleRow("INSERT INTO question (creator_id, creator_username, site_id, title, content, tag_string) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id AS insertId", [creator.id, creator.username, siteid, title, body, tags.map(tag => '<' + tag + '>').join("")]);
        return await Question.FromId(row.insertid);
    }
}

module.exports = Question;
