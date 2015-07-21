var s = [[TERMS]];

var Results = React.createClass({
  getInitialState: function() {
    return {results: []};
  },
  setResults: function(res) {
    this.setState({
      results: res.slice(0, 10),
    });
  },
  render: function() {
    return (
      <ol>
        {this.state.results.map(function(r) {
          return <li>{r.n}{r.d ? ": " + r.d : ""}</li>;
        })}
      </ol>
    );
  }
});

var results = React.render(<Results/>, document.getElementById("results"));

var q = document.getElementById("q"),
    prevquery = "";

function searchCallback() {
  var query = q.value,
      idxs = [],
      terms;

  if (query == prevquery) {
    return;
  }
  prevquery = query;

  terms = query.toLocaleLowerCase().split(/\s+/);

  terms.forEach(function(term) {
    var i = s.t[term];
    if (!i || !i.length) { return; }

    if (idxs.length > 2) {
      var newidxs = [];
      i.forEach(function(idx) {
        if (idxs.indexOf(idx) > -1) {
          newidxs.push(idx)
        }
      });

      idxs = newidxs;

      return;
    }

    idxs = idxs.concat(i);
  });

  results.setResults(idxs.map(function(i) { return s.i[i]; }));
}

q.addEventListener("change", searchCallback, false);
q.addEventListener("keyup", searchCallback, false);
