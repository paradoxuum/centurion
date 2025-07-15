--# selene: allow(undefined_variable)

local vide = require("../vide")

type Instances = {
	AudioChannelSplitter: AudioChannelSplitter,
	AudioPitchShifter: AudioPitchShifter,
	AudioDeviceOutput: AudioDeviceOutput,
	AudioChannelMixer: AudioChannelMixer,
	AudioTextToSpeech: AudioTextToSpeech,
	AudioDeviceInput: AudioDeviceInput,
	AudioDistortion: AudioDistortion,
	AudioCompressor: AudioCompressor,
	AudioEqualizer: AudioEqualizer,
	AudioAnalyzer: AudioAnalyzer,
	AudioListener: AudioListener,
	AudioRecorder: AudioRecorder,
	AudioLimiter: AudioLimiter,
	AudioFlanger: AudioFlanger,
	AudioEmitter: AudioEmitter,
	AudioPlayer: AudioPlayer,
	AudioReverb: AudioReverb,
	AudioFilter: AudioFilter,
	ArcHandles: ArcHandles,
	AudioFader: AudioFader,
	AudioEcho: AudioEcho,
	AdGui: AdGui,
	BoxHandleAdornment: BoxHandleAdornment,
	BillboardGui: BillboardGui,
	BlurEffect: BlurEffect,
	CylinderHandleAdornment: CylinderHandleAdornment,
	ConeHandleAdornment: ConeHandleAdornment,
	CanvasGroup: CanvasGroup,
	Camera: Camera,
	DialogChoice: DialogChoice,
	DragDetector: DragDetector,
	Dialog: Dialog,
	Folder: Folder,
	Frame: Frame,
	Highlight: Highlight,
	Handles: Handles,
	ImageHandLeAdornment: ImageHandleAdornment,
	ImageButton: ImageButton,
	ImageLabel: ImageLabel,
	LineHandleAdornment: LineHandleAdornment,
	ProximityPrompt: ProximityPrompt,
	Part: Part,
	SphereHandLeAdornment: SphereHandleAdornment,
	SelectionSphere: SelectionSphere,
	ScrollingFrame: ScrollingFrame,
	SelectionBox: SelectionBox,
	StyleDerive: StyleDerive,
	SurfaceGui: SurfaceGui,
	StyleSheet: StyleSheet,
	SoundGroup: SoundGroup,
	StyleLink: StyleLink,
	ScreenGui: ScreenGui,
	StyleBase: StyleBase,
	StyleRule: StyleRule,
	Sound: Sound,
	TextButton: TextButton,
	TextLabel: TextLabel,
	TextBox: TextBox,
	UIAspectRatioConstraint: UIAspectRatioConstraint,
	UITextSizeConstraint: UITextSizeConstraint,
	UISizeConstraint: UISizeConstraint,
	UIDragDetector: UIDragDetector,
	UITableLayout: UITableLayout,
	UIPageLayout: UIPageLayout,
	UIGridLayout: UIGridLayout,
	UIListLayout: UIListLayout,
	UIGradient: UIGradient,
	UIFlexItem: UIFlexItem,
	UIPadding: UIPadding,
	UIStroke: UIStroke,
	UICorner: UICorner,
	UIScale: UIScale,
	ViewportFrame: ViewportFrame,
	VideoFrame: VideoFrame,
	WireframeHandleAdornment: WireframeHandleAdornment,
	WorldModel: WorldModel,
	Wire: Wire,
}

type UnknownConnectCallback = (...any) -> ()

type Signal = RBXScriptSignal

type function get_connect(v: type): type?
	local connect = v:readproperty(types.singleton("Connect"))

	if connect and connect:is("function") then
		local head = connect:parameters().head

		if not head then
			return nil
		end
		local callback = head[2]

		if callback and callback:is("function") then
			return callback
		end
	end

	return nil
end

type function is_signal(v: type): type?
	if v == Signal and v.tag == "class" then
		return UnknownConnectCallback
	-- luau lsp types RBXScriptSignals as tables
	elseif v.tag == "table" then
		local connect = get_connect(v)

		if connect then
			return connect
		end

		-- i cba to test if this is needed or not
		local metatable = v:metatable()

		if metatable then
			connect = get_connect(metatable)

			if connect then
				return connect
			end
		end
	end

	return nil
end

type instance = Instance

type Action = setmetatable<{
	callback: (inst: Instance) -> (),
	priority: number,
}, typeof(table.freeze({}))>

type function GetInstance(class_name: type, instances: type): type
	if not class_name:is("singleton") then
		return instance
	end

	return instances:readproperty(class_name) or instance
end

-- temp arg for action, because for some reason its not added as a global automatically
export type function PropertiesFor(class_name: type): type
	local object = GetInstance(class_name, Instances)
	local head_table = {}
	local args_table = { head = head_table }
	local properties = types.newtable()
	local current = object
	local empty_table = {}

	local read_only_properties = table.freeze({
		types.singleton("RobloxLocked"),
		types.singleton("ClassName"),
		types.singleton("UniqueId"),
	})

	while current do
		for property, value in current:properties() do
			if table.find(read_only_properties, property) then
				continue
			end

			local value_read = value.read :: type
			local callback = is_signal(value_read)

			if callback then
				properties:setproperty(property :: any, types.optional(callback))
			elseif value_read.tag == "function" or value_read.tag == "intersection" then
				continue
			elseif value.write then
				head_table[1] = value_read

				properties:setproperty(
					property :: any,
					types.optional(
						types.unionof(types.newfunction(empty_table :: any, args_table :: any), value.write :: any)
					)
				)
			end
		end

		current = current:readparent()
	end

	local nested_table_or_function_or_child = types.newtable()
	local function_returns_child = types.newfunction()
	local union = types.unionof(nested_table_or_function_or_child, function_returns_child, instance, Action)

	nested_table_or_function_or_child:setindexer(types.number, union)
	function_returns_child:setreturns({ union })

	properties:setindexer(types.number, types.optional(union))

	return properties
end

local function create<ClassName>(
	class_name: ClassName | keyof<Instances> | ""
): (props: PropertiesFor<ClassName>) -> GetInstance<ClassName, Instances>
	return function(properties)
		return vide.create(class_name)(properties)
	end
end

return create
