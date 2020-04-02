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

homebrew other others et increase tool nobody behind old friendly lots free
1
-like -f
| / ' <-> > '*
]

# ls(1) -> ls
MAN_CATEGORY = /\b\(\d\)/

# foo, bar, qux -> foo bar qux
PUNCTUATION = /[:.,;(){}\[\]"`!$]/

# 2.0.0 -> <nothing>
VERSION_S = /\b\d+\.\d+(?:\.\d+)\b/

# 'foo -> foo
# foo' -> foo
# foo's -> foo
QUOTES = /\b's\b|'(?:\b|\s|$)|(?:\b|\s|^)'/

# single-
END_HYPHEN = /\b-(\s|$)/

# html2pdf
FMT2FMT = /(\w{2,})2(\w{2,})/

# spaces
WS = /\s+/

ALIASES = {
  "cli" => %w[cli command-line],
  "http(s)" => %w[http https],
  "bash" => %w[bash shell],
  "zsh" => %w[zsh shell],
  "utf8" => %w[utf8 utf-8],
  "utf-8" => %w[utf8 utf-8],
  "go" => %w[go golang],
  "osm" => %w[openstreetmap],
  "db" => %w[database],
  "databases" => %w[database],
  "lib" => %w[library],
  "js" => %w[javascript],
  "frontend" => %w[front-end],
}

class Item
  attr_reader :name, :desc, :version, :homepage
  attr_accessor :executables

  def initialize(f)
    @name = f.name
    @desc = f.desc || ""
    @version = f.version.to_s
    @homepage = f.homepage
    @executables = []
  end

  def terms
    @terms || @terms = _terms
  end

  def to_h
    {:n => @name,
     :d => @desc,
     :v => @version,
     :h => @homepage,
     :e => @executables}
  end

  def to_a
    [@name, @desc, @version, @homepage, @executables]
  end

  private

  def _terms
    (item_terms + executables_terms).uniq
  end

  def executables_terms
    # only keep max 10 executables, the longuest ones first
    executables.sort {|a,b| b.length <=> a.length }.slice(0, 10).map(&:downcase)
  end

  def item_terms
    s = Set.new (clean_desc.split(WS) + @name.split("/") - STOPWORDS)
    ALIASES.each_entry do |k,vs|
      if s.include? k
        s.delete k
        vs.each { |v| s << v }
      end
    end

    s.clone.each do |t|
      # remove JARs
      if t.end_with? ".jar"
        s.delete t
        next
      end

      # remove too-long terms
      if t.length > 25
        s.delete t
        next
      end

      # brew & git subcommands
      if t.start_with?("brew-") || t.start_with?("git-")
        t.split("-").each { |v| s << v }
      end

      # split terms like "Foo/Bar" into "Foo" and "Bar"
      if t.include? "/"
        s.delete t
        t.split("/").each { |v| s << v }
      end

      # index both parts of, e.g. "ps2pdf" ("ps" and "pdf")
      if t =~ FMT2FMT
        s << $1 << $2
      end
    end

    s.to_a
  end

  def clean_desc
    @desc.downcase.gsub(MAN_CATEGORY, "").
      gsub(VERSION_S, "").
      gsub(QUOTES, "").
      gsub(PUNCTUATION, " ").
      gsub(END_HYPHEN, " ").
      strip
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

  def executables
    @executables || @executables = import_executables
  end

  def compiled
    @compiled || @compiled = compile
  end

  def compile
    items = []
    terms = {}
    idx = 0

    Formula.each do |f|
      next unless f.desc && f.stable && f.core_formula?
      i = Item.new(f)
      i.executables = executables.fetch(f.full_name, []) unless f.keg_only?

      items << i.to_a

      i.terms.each do |t|
        (terms[t] ||= []) << idx
      end

      idx += 1
    end

    {:i => items, :t => terms, :a => ALIASES}
  end

  def import_executables
    require "cmd/tap"
    tap = Tap.fetch("homebrew", "command-not-found")
    install_tap(tap.user, tap.repo) unless tap.installed?
    s = tap.path/"executables.txt"
    return {} unless s.exist?

    ex = {}
    s.each_line do |l|
      f, es = l.chomp.split(":")
      next if es.nil?
      ex[f] = es.split(" ")
    end

    ex
  end
end

case ARGV.shift
when "dump"
  ohai "Creating the DB..."
  db = DB.new
  ohai "Compiling..."
  db.compile!
  ohai "Writing..."
  db.dump(*ARGV)
  ohai "Done!"
else
  puts "Usage: brew searchdb dump <filename>"
end
