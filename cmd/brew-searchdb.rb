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

  private

  def _terms
    clean_desc.split(WS) + @name.split("/") - STOPWORDS
  end
end

# This is just a PoC, it could really be optimized
class DB
  attr_reader :items

  def init!
    @items = []
    Formula.each do |f|
      next unless f.desc
      @items << Item.new(f)
    end
    nil
  end

  def terms
    s = Set.new
    @items.each { |i| i.terms.each { |t| s.add(t) } }
    s.to_a
  end

  def dump(filename)
    File.open(filename, "w") { |f| f.write to_json }
  end

  def compile!
    @compiled = compile
    nil
  end

  def search(*terms)
    idx = terms.map { |t| @compiled[:t][t] || [] }.reduce(&:&)
    idx.map { |i| @compiled[:i][i] }
  end

  def to_json
    to_h.to_json
  end

  def to_h
    @compiled || @compiled = compile
  end

  private

  def compile
    itemls = items.map { |i| {:n => i.name, :d => i.desc} }

    vs = terms.map do |term|
      [
        term,
        items.select { |item| item.match? term }.map do |item|
          itemls.index { |i| i[:n] == item.name }
        end
      ]
    end

    {:i => itemls, :t => Hash[vs]}
  end
end

case ARGV.shift
when "dump"
  ohai "Creating the DB..."
  db = DB.new
  db.init!
  ohai "Optimizing for search..."
  db.compile!
  ohai "Writing..."
  db.dump(*ARGV)
  ohai "Done!"
else
  puts "Usage: brew searchdb dump <filename>"
end
