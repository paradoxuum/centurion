-- helpers for building RichText strings

local function escape(text: string): string
	return (text:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"):gsub('"', "&quot;"):gsub("'", "&apos;"))
end

local function color(text: string, value: Color3): string
	return `<font color="#{value:ToHex()}">{text}</font>`
end

return {
	escape = escape,
	color = color,
}
