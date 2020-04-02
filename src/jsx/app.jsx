/*jshint esnext:true */
let s = [[TERMS]];

import React from "react";

// https://teamtreehouse.com/community/i-get-this-error-react2defaultcreateclass-is-not-a-function-and-reactproptypes-is-undefined
import createClass from "create-react-class";
// https://stackoverflow.com/questions/36376146/reactdom2-default-render-is-not-a-function
import ReactDOM from "react-dom";

const MAX_RESULTS = 40;

const NAME = 0,
      DESC = 1,
      VERSION = 2,
      HOMEPAGE = 3,
      EXECUTABLES = 4;


let Formula = createClass({
  binaries: function() {
    let n = this.props.exes.length;
    return n === 0 ? "" : n > 1 ? "Executables:" : "Executable:";
  },
  render: function() {
    /* jshint ignore:start */
    return (
      <li className="formula">
        <h2 className="title">
          <span className="name">{this.props.name}</span>
          {" "}
          (<span className="version">{this.props.version}</span>)
        </h2>
        <p className="desc"><span>{this.props.desc}</span> — <a href={this.props.homepage} rel="external nofollow">Homepage</a></p>
        <pre class="install"><code>brew install {this.props.name}</code></pre>
        {this.binaries()}
        <ul className="executables">
          {this.props.exes.map(e => <li key={e}>{e}</li>)}
        </ul>
      </li>
    );
    /* jshint ignore:end */
  }
});

let Results = createClass({
  getInitialState: function() { return {results: []}; },
  setResults: function(res) {
    return this.setState({
      results: res.slice(0, MAX_RESULTS),
    });
  },
  reset: function() { this.setState({ results: [] }); },
  render: function() {
    /* jshint ignore:start */
    return (
      <ol>
        {this.state.results.map(f =>
          <Formula name={f[NAME]}
                   desc={f[DESC]}
                   exes={f[EXECUTABLES]}
                   homepage={f[HOMEPAGE]}
                   version={f[VERSION]}
                   key={f[NAME]} />
        )}
      </ol>
    );
    /* jshint ignore:end */
  }
});

// jshint ignore:start
let results = ReactDOM.render(<Results/>, document.getElementById("results"));
// jshint ignore:end

let q = document.getElementById("q"),
    prevquery = "";

function getTerms(query) {
  // sorry no quotes for now
  let words = query.toLowerCase().replace('"', "").split(/\s+/),
      terms = [],
      a = s.a;

  words.forEach((w) => {
    // use aliases
    if (a.hasOwnProperty(w)) {
      terms = terms.concat(a[w]);
      return;
    }

    terms.push(w);
  });

  return terms;
}

function escapeRegExp(r) {
  return r.replace(/([.(){}\[\]*+?^$])/g, "\\$1");
}

function expandPartialTerm(partial) {
  var r = new RegExp("^" + escapeRegExp(partial) + "."),
      ts = [],
      max = 5;

  for (var t in s.t) {
    if (r.test(t)) {
      if (max-- === 0) {
        break;
      }
      ts.push(t);
    }
  }

  return ts;
}

function matchingDocs(terms) {
  var docs = {};

  terms.forEach(term => {
    var idxs = s.t[term];
    if (!idxs || !idxs.length) { return; }

    idxs.forEach(idx => {
      docs[idx] = s.i[idx];
    });
  });

  return docs;
}

function scoreDocTerm(term, doc, i) {
  let score = 0;

  // -1 if the formula is from a tap: put the core ones above
  if (doc.n.indexOf("/") > -1) {
    score--;
  }

  // -1 if the formula is e.g. foo@2.2 unless there's a @ in the term search
  if (doc.n.indexOf("@") > -1 && term.indexOf("@") == -1) {
    score--;
  }

  // term == name: 100
  if (term == doc.n) {
    return score + 100;
  }

  // term == executable: 90
  if (doc.e.indexOf(term) > -1) {
    return score + 90;
  }

  var nameTermIndex = doc.n.indexOf(term);

  // name starts with term: 80
  // name starts with one letter then the term: 70
  switch (nameTermIndex) {
  case -1: break;
  case 0: return score + 80;
  case 1: return score + 70;
  // we might want to add more cases here
  }

  // term match document: 60
  if (s.t[term] && s.t[term].indexOf(i) > -1) {
    return score + 60;
  }

  return score + 2;
}

function scoreDocTerms(terms, doc, i) {
  var score = 0;

  terms.forEach(term => {
    score += scoreDocTerm(term, doc, i);
  });

  return score;
}
// debug
// window.sdt = scoreDocTerms;
// window.s = s;

function sortDocs(terms, docs) {
  var scored = [],
      doc;

  for (var i in docs) {
    doc = docs[i];
    scored.push([doc, scoreDocTerms(terms, doc, +i)]);
  }

  return scored.sort((a, b) => {
    var sa = a[1],
        sb = b[1];

    return sa == sb ? 0 : sa < sb ? 1 : -1;
  }).map(s => s[0]);
}

var searching = false;

function searchCallback() {
  if (searching) { return; }
  searching = true;
  try {
    _searchCallback();
  } finally {
    searching = false;
  }
}

function _searchCallback() {
  var query = q.value,
      idxs = [],
      terms;

  if (query == prevquery) {
    return;
  }
  prevquery = query;

  if (query.length === 0) {
    results.reset();
    return;
  }

  terms = getTerms(query);

  if (terms.length === 0) {
    return;
  }

  var lastTerm = terms[terms.length-1];
  if (lastTerm === "") {
    terms.pop();
  }

  var docs = sortDocs(terms, matchingDocs(terms));

  // if no results, try with partial matching
  if (docs.length === 0 && query.length > 1) {
    terms = terms.concat(expandPartialTerm(lastTerm));
    docs = sortDocs(terms, matchingDocs(terms));
  }

  results.setResults(docs);
}

q.addEventListener("change", searchCallback, false);
q.addEventListener("keyup", searchCallback, false);
q.focus();

var hash = document.location.hash.slice(1);
if (hash !== "" && q.value === "") {
  q.value = decodeURIComponent(hash);
  searchCallback();
}
