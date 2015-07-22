# -*- coding: UTF-8 -*-

require "formula"

require "json"
require "set"

# from http://www.ranks.nl/stopwords
STOPWORDS = %w[
a about above after again against all am an and any are aren't as at be because
been before being below between both but by can't cannot could couldn't did
didn't do does doesn't doing don't down during each few for from further had
hadn't has hasn't have haven't having he he'd he'll he's her here here's hers
herself him himself his how how's i i'd i'll i'm i've if in into is isn't it
it's its itself let's me more most mustn't my myself no nor not of off on once
only or other ought our ours ourselves out over own same shan't she she'd
she'll she's should shouldn't so some such than that that's the their theirs
them themselves then there there's these they they'd they'll they're they've
this those through to too under until up very was wasn't we we'd we'll we're
we've were weren't what what's when when's where where's which while who who's
whom why why's with won't would wouldn't you you'd you'll you're you've your
yours yourself yourselves

homebrew
]

MAN_CAT = /\b\(\d\)/
PUNCTUATION = /[:.,;(){}\[\]"`]/
WS = /\s+/

class Item
  attr_reader :name, :desc

  def initialize(f)
    @name = f.full_name
    @desc = f.desc || ""
  end

  def terms
    @terms || @terms = _terms
  end

  def clean_desc
    @desc.downcase.gsub(MAN_CAT, "").gsub(PUNCTUATION, " ")
  end

  def match?(term)
    return terms.include? term
  end

  def to_h
    {:n => @name, :d => @desc}
  end

  private

  def _terms
    clean_desc.split(WS) + @name.split("/") - STOPWORDS
  end
end

class DB
  def dump(filename)
    File.open(filename, "w") { |f| f.write to_json }
  end

  def compile!
    compiled
    nil
  end

  def items
    compiled[:i]
  end

  def terms
    compiled[:t]
  end

  def to_json
    compiled.to_json
  end

  def to_h
    compiled
  end

  private

  def compiled
    @compiled || @compiled = compile
  end

  def compile
    items = []
    terms = {}
    idx = 0

    Formula.each do |f|
      next unless f.desc
      i = Item.new(f)

      items << i.to_h

      i.terms.each do |t|
        terms[t] ||= []
        terms[t] << idx
      end

      idx += 1
    end

    {:i => items, :t => terms}
  end
end

case ARGV.shift
when "dump"
  ohai "Compiling the DB..."
  db = DB.new
  db.compile!
  ohai "Writing..."
  db.dump(*ARGV)
  ohai "Done!"
else
  puts "Usage: brew searchdb dump <filename>"
end
