# Homebrew Search

An unofficial Web-based search engine for [Homebrew](http://brew.sh/) formulae.

## DB

On the `master` branch:

    brew searchdb dump terms.json

## Web page

On the `gh-pages` branch:

    gulp css js

Then commit and push. Unfortunately we must commit the files in `build/` to
have them on GitHub pages.
