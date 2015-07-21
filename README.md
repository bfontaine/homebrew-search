# Homebrew Search

An unofficial Web-based search engine for [Homebrew](http://brew.sh/) formulae.

## DB

On the `master` branch:

    brew searchdb dump terms.json

## Web page

On the `gh-pages` branch:

    jsx -x jsx src build
    ./gen.rb

Then commit and push.
