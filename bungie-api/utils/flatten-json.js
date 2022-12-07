export default function flattenJSON(generator, data, schema){
    let temp = {};
    let iterator = generator("#", data, schema);
    while(true){
        let next = iterator.next();
        if(next.done)
            break;
        temp[next.value[0]] = next.value[1];
    }
    return temp;
}