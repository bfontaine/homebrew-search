var s = [[TERMS]];

var baseRepoURL = "https://github.com/Homebrew/homebrew";

var Formula = React.createClass({
  binaries: function() {
    var n = this.props.exes.length;
    return n === 0 ? "" : n > 1 ? "Binaries:" : "Binary:";
  },
  render: function() {
    return (
      <li class="formula">
        <h2 class="title">
          <span class="name">{this.props.name}</span>
          {" "}
          (<span class="version">{this.props.version}</span>)
        </h2>
        <ul class="meta-links">
          <li><a href={this.props.homepage} rel="external nofollow">Homepage</a></li>
        </ul>
        <p class="desc">{this.props.desc}</p>
        {this.binaries()}
        <ul class="executables">
          {this.props.exes.map(function(e) {
            return (
              <li>{e}</li>
            );
          })}
        </ul>
      </li>
    );
  }
});

var Results = React.createClass({
  getInitialState: function() {
    return {results: []};
  },
  setResults: function(res) {
    this.setState({
      results: res.slice(0, 10),
    });
  },
  reset: function() {
    this.setState({
      results: [],
    });
  },
  render: function() {
    return (
      <ol>
        {this.state.results.map(function(f) {
          return <Formula name={f.n} desc={f.d} exes={f.e}
                          homepage={f.h} version={f.v} />;
        })}
      </ol>
    );
  }
});

var results = React.render(<Results/>, document.getElementById("results"));

var q = document.getElementById("q"),
    prevquery = "";

function getTerms(query) {
  // sorry no quotes for now
  return query.toLowerCase().replace('"', "").split(/\s+/);
}

function escapeRegExp(r) {
  return r.replace(/([.(){}\[\]*+?^$])/g, "\\$1")
}

function expandPartialTerm(partial) {
  var r = new RegExp("^" + escapeRegExp(partial) + "."),
      ts = [],
      max = 5;

  for (var t in s.t) {
    if (r.test(t)) {
      if (max-- == 0) {
        break;
      }
      ts.push(t);
    }
  }

  return ts;
}

function matchingDocs(terms) {
  var docs = {};

  terms.forEach(function(term) {
    var idxs = s.t[term];
    if (!idxs || !idxs.length) { return; }

    idxs.forEach(function(idx) {
      docs[idx] = s.i[idx];
    });
  });

  return docs;
}

function scoreDocTerm(term, doc) {
  // term == name: 100
  if (term == doc.n) {
    return 100;
  }

  // term == executable: 90
  if (doc.e.indexOf(term) > -1) {
    return 90;
  }

  var nameTermIndex = doc.n.indexOf(term);

  // name starts with term: 80
  // name starts with one letter then the term: 70
  switch (nameTermIndex) {
  case -1: break;
  case 0: return 80;
  case 1: return 70;
  // we might want to add more cases here
  }

  return 1;
}

function scoreDocTerms(terms, doc) {
  var maxScore = 0;

  terms.forEach(function(term) {
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

  return scored.sort(function(a, b) {
    var sa = a[1],
        sb = b[1];

    return sa == sb ? 0 : sa < sb ? 1 : -1;
  }).map(function(s) { return s[0]; });
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

  if (query.length < 2) {
    results.reset();
    return;
  }

  terms = getTerms(query);

  if (terms.length == 0) {
    return
  }

  var lastTerm = terms[terms.length-1];
  if (lastTerm == "") {
    terms.pop();
  }

  var docs = sortDocs(terms, matchingDocs(terms));

  // if no results, try with partial matching
  if (docs.length == 0) {
    terms = terms.concat(expandPartialTerm(lastTerm));
    docs = sortDocs(terms, matchingDocs(terms));
  }

  results.setResults(docs);
}

q.addEventListener("change", searchCallback, false);
q.addEventListener("keyup", searchCallback, false);
