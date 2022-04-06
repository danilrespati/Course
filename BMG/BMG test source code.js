function frontendBackend(n) {
    const result = [];
    for(let i = 1; i <= n; i++) {
        if(i % 3 == 0 && i % 5 == 0) result.push('Frontend Backend')
        else if(i % 3 == 0) result.push('Frontend')
        else if(i % 5 == 0) result.push('Backend')
        else result.push(i);
    }
    return result.join(',');
}

console.log(frontendBackend(50));