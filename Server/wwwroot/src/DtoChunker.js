import { DtoWrapper } from "./Interfaces/Dtos.js";
import { CreateGUID } from "./Utilities.js";
const Chunks = {};
const MessagePack = window['msgpack5']();
export function ChunkDto(dto, dtoType, requestId = null, chunkSize = 50000) {
    const messageBytes = MessagePack.encode(dto);
    const instanceId = CreateGUID();
    const chunks = [];
    const wrappers = [];
    for (let i = 0; i < messageBytes.length; i += chunkSize) {
        const chunk = messageBytes.subarray(i, i + chunkSize);
        chunks.push(chunk);
    }
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const wrapper = new DtoWrapper();
        wrapper.DtoChunk = chunk;
        wrapper.DtoType = dtoType;
        wrapper.InstanceId = instanceId;
        wrapper.IsFirstChunk = i == 0;
        wrapper.IsLastChunk = i == chunks.length - 1;
        wrapper.RequestId = requestId;
        wrapper.SequenceId = i;
        wrappers.push(wrapper);
    }
    return wrappers;
}
export function TryComplete(wrapper) {
    if (!Chunks[wrapper.InstanceId]) {
        Chunks[wrapper.InstanceId] = [];
    }
    Chunks[wrapper.InstanceId].push(wrapper);
    if (!wrapper.IsLastChunk) {
        return;
    }
    const buffers = Chunks[wrapper.InstanceId]
        .sort((a, b) => a.SequenceId - b.SequenceId)
        .map(x => x.DtoChunk)
        .reduce(x => x);
    delete Chunks[wrapper.InstanceId];
    return MessagePack.decode(buffers);
}
//# sourceMappingURL=DtoChunker.js.map