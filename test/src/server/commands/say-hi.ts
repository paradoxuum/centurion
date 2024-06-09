import { Command, CommandContext, Commander, Guard } from "../../shared";

const isOwner = (interaction: CommandContext) => {
    return interaction.executor?.UserId === 1
}

@Commander
export class SayHiCommand {
    @Command({
        name: "sayhi",
        description: "Say hi!",
        shortcuts: [[Enum.KeyCode.LeftAlt, Enum.KeyCode.H]]
    })
    @Guard(isOwner)
    run(ctx: CommandContext) {
        print('Hi 🙂!')
    }
}