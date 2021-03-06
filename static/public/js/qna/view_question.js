if (loggedIn) {
    createEditor(document.querySelector('#answer-input'), document.querySelector('#answer-preview'));
}

document.querySelectorAll('.upvote').forEach(el => {
    el.addEventListener("click", async evt => {
        _handleClick(el, true);
    });
});

document.querySelectorAll('.downvote').forEach(el => {
    el.addEventListener("click", async evt => {
        _handleClick(el, false);
    });
});

document.querySelectorAll('.solution_mark').forEach(el => {
    el.addEventListener("click", async evt => {
        _handleSolutionize(el, !el.classList.contains("is_solution"));
    });
});

function _handleClick(el, positive) {
    if (!loggedIn) {
        window.location.href = "/users/signin?r=" + encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
        return;
    }
    const oppArrowSelector = el.parentElement.querySelector(positive ? '.downvote' : '.upvote');

    let main;
    let opp;
    if (positive) {
        main = el.parentElement.querySelector('.positive');
        opp = el.parentElement.querySelector('.negative');
    } else {
        opp = el.parentElement.querySelector('.positive');
        main = el.parentElement.querySelector('.negative');
    }

    const qaid = el.parentElement.getAttribute('data-link-id');
    if (el.classList.contains("selected")) {
        unvote(qaid).then(_ => {
            addToVote(main, -1);
            el.classList.remove("selected");
        });
    } else {
        vote(qaid, positive).then(_ => {
            el.classList.add("selected");
            addToVote(main, 1);
        });
    }
    if (oppArrowSelector.classList.contains("selected")) {
        oppArrowSelector.classList.remove("selected");
        addToVote(opp, -1);
    }
}

function addToVote(el, amount) {
    el.querySelector('span').innerText = Math.max(parseInt(el.querySelector('span').innerText) + amount, 0).toString();
}

async function voteRequest(fetchFunction) {
    const resp = await fetchFunction;
    const content = await resp.json();
    if (!content.success) {
        await createAlert("error", content.error);
        throw content.error;
    }
    return true;
}

function vote(qaid, upvote) {
    const formdata = new URLSearchParams();
    formdata.append("qa_id", qaid);
    formdata.append("upvote", upvote);
    return voteRequest(fetch(`/vote/vote`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formdata
    }));
}

function unvote(qaid) {
    const formdata = new URLSearchParams();
    formdata.append("qa_id", qaid);
    return voteRequest(fetch(`/vote/unvote`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formdata
    }));
}

function solutionize(qaid) {
    const formdata = new URLSearchParams();
    formdata.append("qa_id", qaid);
    return voteRequest(fetch(`/vote/solutionize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formdata
    }));
}

function unsolutionize(qaid) {
    const formdata = new URLSearchParams();
    formdata.append("qa_id", qaid);
    return voteRequest(fetch(`/vote/unsolutionize`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formdata
    }));
}

function _handleSolutionize(el, shouldSolutionize) {
    const qaId = el.parentElement.getAttribute('data-link-id');

    if (shouldSolutionize) {
        solutionize(qaId).then(_ => el.classList.add("is_solution"));
    } else {
        unsolutionize(qaId).then(_ => el.classList.remove("is_solution"));
    }
}
