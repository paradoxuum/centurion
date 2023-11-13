import { UseProducerHook, useProducer } from "@rbxts/react-reflex";
import { RootStore } from "../store";

export const useStore: UseProducerHook<RootStore> = useProducer;
