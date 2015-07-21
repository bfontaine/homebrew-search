#! /usr/bin/env ruby
# -*- coding: UTF-8 -*-

js = File.read("app.js")
json = File.read("terms.json")

File.open("s.js", "w") { |f| f.write js.sub("[[TERMS]]", json) }
