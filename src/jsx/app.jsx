/*jshint esnext:true */
let s = [[TERMS]];

import React from "react";

let baseRepoURL = "https://github.com/Homebrew/homebrew";

let Name = React.createClass({
  tapName: function() {
    let name = this.props.name;

    if (name.indexOf("/") == -1) { return ""; }
    let [u, r, _] = name.split("/");
    /* jshint ignore:start */
    return <span className="tap-name">{`${u}/${r}/`}</span>;
    /* jshint ignore:end */
  },
  name: function() {
    let parts = this.props.name.split("/");
    return parts[parts.length-1];
  },
  render: function() {
    /* jshint ignore:start */
    return (
      <span className="name">{this.tapName()}{this.name()}</span>
    );
    /* jshint ignore:end */
  }
});

let Formula = React.createClass({
  binaries: function() {
    let n = this.props.exes.length;
    return n === 0 ? "" : n > 1 ? "Binaries:" : "Binary:";
  },
  render: function() {
    /* jshint ignore:start */
    return (
      <li className="formula">
        <h2 className="title">
          <Name name={this.props.name} />
          {" "}
          (<span className="version">{this.props.version}</span>)
        </h2>
        <ul className="meta-links">
          <li><a href={this.props.homepage} rel="external nofollow">Homepage</a></li>
        </ul>
        <p className="desc">{this.props.desc}</p>
        {this.binaries()}
        <ul className="executables">
          {this.props.exes.map(e => <li key={e}>{e}</li>)}
        </ul>
      </li>
    );
    /* jshint ignore:end */
  }
});

let Results = React.createClass({
  getInitialState: function() { return {results: []}; },
  setResults: function(res) {
    return this.setState({
      results: res.slice(0, 10),
    });
  },
  reset: function() { this.setState({ results: [] }); },
  render: function() {
    /* jshint ignore:start */
    return (
      <ol>
        {this.state.results.map(f =>
          <Formula name={f.n} desc={f.d} exes={f.e} homepage={f.h}
                   version={f.v} key={f.n} />
        )}
      </ol>
    );
    /* jshint ignore:end */
  }
});

// jshint ignore:start
let results = React.render(<Results/>, document.getElementById("results"));
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

function scoreDocTerm(term, doc) {
  // -1 if the formula is from a tap: put the core ones above
  let score = doc.n.indexOf("/") > -1 ? -1 : 0;

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

  return score + 2;
}

function scoreDocTerms(terms, doc) {
  var maxScore = 0;

  terms.forEach(term => {
    var s = scoreDocTerm(term, doc);

    if (s > maxScore) {
      maxScore = s;
    }
  });

  return maxScore;
}

function sortDocs(terms, docs) {
  var scored = [],
      doc;

  for (var name in docs) {
    doc = docs[name];
    scored.push([doc, scoreDocTerms(terms, doc)]);
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
