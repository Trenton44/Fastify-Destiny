export default function flattenJSON(generator, params){
    let temp = {};
    let iterator = generator(...params);
    while(true){
        let next = iterator.next();
        if(next.done)
            break;
        temp[next.value[0]] = next.value[1];
    }
    return temp;
}