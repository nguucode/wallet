# Validates spec/: story frontmatter, numbering, routes vs sitemap, dependsOn, reserved IDs, required sections.
Encoding.default_external = Encoding::UTF_8
# Run: ruby scripts/check-spec.rb   (exit 1 on any error)
# shortcut: Ruby because the repo has no Node app yet; port to a zod Vitest test when the app is scaffolded (as in Fortify).
require "yaml"

ROOT = File.expand_path("../spec", __dir__)
errors = []
err = ->(msg) { errors << msg }

sitemap = YAML.load_file(File.join(ROOT, "ia/sitemap.yaml"))
routes = sitemap["screens"].map { |s| s["route"].split("?").first }

readme = File.read(File.join(ROOT, "README.md"))
reserved = readme.scan(/^\| (US-[A-Z]{3}-\d{3}) \| (.+?) \|$/).to_h

SECTIONS = ["## Story", "## Acceptance criteria", "## UI states", "## Design notes", "## FE notes", "## Mock data"]
REQUIRED = %w[id title epic priority status size routes dependsOn]
BANNED = [/\[verify\]/i, /pending verification/i, /Cánh Diều|Mây Trắng|Hải Đăng|Phù Sa|Trúc Xanh|Sông Lam/]

stories = {}
Dir.glob(File.join(ROOT, "epics/*/")).sort.each do |dir|
  code = File.basename(dir).upcase
  err.("#{code}: missing epic.md") unless File.exist?(File.join(dir, "epic.md"))
  files = Dir.glob(File.join(dir, "US-*.md")).reject { |f| File.basename(f).start_with?("._") }.sort
  files.each_with_index do |f, i|
    name = File.basename(f, ".md")
    text = File.read(f)
    m = text.match(/\A---\n(.*?)\n---\n/m)
    next err.("#{name}: no frontmatter") unless m
    fm = begin
      YAML.safe_load(m[1])
    rescue Psych::SyntaxError => e
      err.("#{name}: frontmatter YAML #{e.message[/line.*/]}")
      next
    end
    REQUIRED.each { |k| err.("#{name}: missing #{k}") unless fm.key?(k) }
    err.("#{name}: id #{fm['id']} != filename") unless fm["id"] == name
    err.("#{name}: epic #{fm['epic']} != dir #{code}") unless fm["epic"] == code
    err.("#{name}: expected #{format('US-%s-%03d', code, i + 1)} (numbering gap)") unless name == format("US-%s-%03d", code, i + 1)
    err.("#{name}: priority #{fm['priority']} (only P0 gets a file)") unless fm["priority"] == "P0"
    err.("#{name}: size #{fm['size']}") unless %w[S M].include?(fm["size"])
    err.("#{name}: status #{fm['status']}") unless ["Draft", "Ready", "In design", "In build", "Done"].include?(fm["status"])
    Array(fm["routes"]).each { |r| err.("#{name}: route #{r} not in sitemap") unless routes.include?(r.to_s.split("?").first) }
    SECTIONS.each { |s| err.("#{name}: missing section #{s}") unless text.include?("\n#{s}\n") }
    BANNED.each { |re| err.("#{name}: banned text #{re.source}") if text =~ re }
    stories[name] = fm
  end
end

stories.each do |name, fm|
  Array(fm["dependsOn"]).each do |d|
    err.("#{name}: dependsOn #{d} does not exist") unless stories.key?(d)
    err.("#{name}: depends on itself") if d == name
  end
end
reserved.each do |id, title|
  if !stories.key?(id) then err.("reserved #{id} not written")
  elsif stories[id]["title"] != title then err.("#{id}: title '#{stories[id]['title']}' != reserved '#{title}'")
  end
end

# dependency cycles
visit = {}
cyc = lambda do |n, path|
  return err.("cycle: #{(path + [n]).join(' → ')}") if visit[n] == :open
  return if visit[n] == :done
  visit[n] = :open
  Array(stories.dig(n, "dependsOn")).each { |d| cyc.(d, path + [n]) if stories.key?(d) }
  visit[n] = :done
end
stories.keys.each { |n| cyc.(n, []) }

by_epic = stories.values.group_by { |s| s["epic"] }.transform_values(&:size)
puts "stories: #{stories.size} #{by_epic}"
if errors.empty? then puts "spec OK"
else puts errors.map { |e| "✗ #{e}" }; exit 1
end
