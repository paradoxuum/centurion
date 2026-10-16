local parse = require("../../pkgs/centurion/src/parse")
local testkit = require("./testkit").test()

local TEST, CASE, CHECK = testkit.TEST, testkit.CASE, testkit.CHECK

-- spans are inclusive, 1-based byte ranges into the raw text, covering the
-- token's source including any quotes and escapes
local function span_of(token: parse.Token): string
	return `{token.span.x}-{token.span.y}`
end

local function source_of(text: string, token: parse.Token): string
	return text:sub(token.span.x, token.span.y)
end

TEST("plain tokens", function()
	local res = parse("kick Bob", " ")

	CASE("are split on the split character")
	CHECK(#res.tokens == 2)
	CHECK(res.tokens[1].text == "kick" and res.tokens[2].text == "Bob")

	CASE("have spans matching their text")
	CHECK(span_of(res.tokens[1]) == "1-4")
	CHECK(span_of(res.tokens[2]) == "6-8")

	CASE("aren't quoted")
	CHECK(not res.tokens[1].quoted and not res.tokens[2].quoted)

	CASE("repeated, leading and trailing separators are skipped")
	local spaced = parse("  a  b ", " ")
	CHECK(#spaced.tokens == 2)
	CHECK(span_of(spaced.tokens[1]) == "3-3")
	CHECK(span_of(spaced.tokens[2]) == "6-6")

	CASE("a custom split character works")
	local commas = parse("a,b,,c", ",")
	CHECK(#commas.tokens == 3)
	CHECK(commas.tokens[3].text == "c" and span_of(commas.tokens[3]) == "6-6")

	CASE("empty input has no tokens")
	CHECK(#parse("", " ").tokens == 0)
	CHECK(#parse("   ", " ").tokens == 0)
end)

TEST("quoted tokens", function()
	local text = 'say "hi there" x'
	local res = parse(text, " ")

	CASE("keep separators inside the quotes")
	CHECK(#res.tokens == 3)
	CHECK(res.tokens[2].text == "hi there")

	CASE("are marked as quoted")
	CHECK(res.tokens[2].quoted and not res.tokens[3].quoted)

	CASE("have spans that include the quotes")
	CHECK(span_of(res.tokens[2]) == "5-14")
	CHECK(source_of(text, res.tokens[2]) == '"hi there"')

	CASE("following tokens have the right span")
	CHECK(span_of(res.tokens[3]) == "16-16")

	CASE("single quotes work too")
	local single = parse("say 'hi there'", " ")
	CHECK(single.tokens[2].text == "hi there" and span_of(single.tokens[2]) == "5-14")

	CASE("the other quote character is literal inside quotes")
	CHECK(parse([["a'b"]], " ").tokens[1].text == "a'b")

	CASE("empty quotes produce an empty token")
	local empty = parse('x "" y', " ")
	CHECK(#empty.tokens == 3)
	CHECK(empty.tokens[2].text == "" and empty.tokens[2].quoted)
	CHECK(span_of(empty.tokens[2]) == "3-4")

	CASE("quotes in the middle of a word join it into one token")
	local joined = parse('a"b c"d', " ")
	CHECK(#joined.tokens == 1)
	CHECK(joined.tokens[1].text == "ab cd" and span_of(joined.tokens[1]) == "1-7")
end)

TEST("unclosed quotes", function()
	local text = 'say "hi'
	local res = parse(text, " ")

	CASE("are flagged")
	CHECK(res.unclosed_quote)

	CASE("the token runs to the end of the input")
	CHECK(res.tokens[2].text == "hi" and res.tokens[2].quoted)
	CHECK(span_of(res.tokens[2]) == "5-7")

	CASE("closed quotes aren't flagged")
	CHECK(not parse('say "hi"', " ").unclosed_quote)
end)

TEST("escapes", function()
	CASE("a leading escape starts the span at the backslash")
	local leading = parse("\\a b", " ")
	CHECK(leading.tokens[1].text == "a")
	CHECK(span_of(leading.tokens[1]) == "1-2")
	CHECK(span_of(leading.tokens[2]) == "4-4")

	CASE("an escaped separator is part of the token")
	local text = "a\\ b c"
	local spaced = parse(text, " ")
	CHECK(#spaced.tokens == 2)
	CHECK(spaced.tokens[1].text == "a b")
	CHECK(source_of(text, spaced.tokens[1]) == "a\\ b")
	CHECK(span_of(spaced.tokens[2]) == "6-6")

	CASE("escape sequences are translated")
	CHECK(parse("a\\nb", " ").tokens[1].text == "a\nb")
	CHECK(parse("a\\tb", " ").tokens[1].text == "a\tb")
	CHECK(parse("\\\\", " ").tokens[1].text == "\\")

	CASE("an escaped quote doesn't end a quoted token")
	local quoted = parse([["a\"b"]], " ")
	CHECK(#quoted.tokens == 1)
	CHECK(quoted.tokens[1].text == 'a"b' and span_of(quoted.tokens[1]) == "1-6")
	CHECK(not quoted.unclosed_quote)

	CASE("an escaped quote doesn't start a quoted token")
	local literal = parse('\\"a b', " ")
	CHECK(#literal.tokens == 2)
	CHECK(literal.tokens[1].text == '"a' and not literal.tokens[1].quoted)

	-- there's nothing left to escape, so the backslash is dropped. the span
	-- still covers it, so highlighting includes it
	CASE("a trailing backslash is dropped from the text but kept in the span")
	local trailing = parse("a\\", " ")
	CHECK(trailing.tokens[1].text == "a" and span_of(trailing.tokens[1]) == "1-2")
end)

TEST("spans cover the source", function()
	local text = [[ say  "hello world" \"x 'a b'c  d\ e ]]
	local res = parse(text, " ")

	CASE("every token's span is within the input")
	for _, token in res.tokens do
		CHECK(token.span.x >= 1 and token.span.y <= #text and token.span.x <= token.span.y)
	end

	CASE("spans don't overlap and are in order")
	for i = 2, #res.tokens do
		CHECK(res.tokens[i].span.x > res.tokens[i - 1].span.y)
	end

	CASE("a span never starts or ends on a separator")
	for _, token in res.tokens do
		CHECK(text:sub(token.span.x, token.span.x) ~= " ")
		CHECK(text:sub(token.span.y, token.span.y) ~= " ")
	end
end)

return nil
