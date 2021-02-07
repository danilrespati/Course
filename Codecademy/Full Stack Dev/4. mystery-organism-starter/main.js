// Returns a random DNA base
const returnRandBase = () => {
  const dnaBases = ['A', 'T', 'C', 'G'];
  return dnaBases[Math.floor(Math.random() * 4)];
};

// Returns a random single stand of DNA containing 15 bases
const mockUpStrand = () => {
  const newStrand = [];
  for (let i = 0; i < 15; i++) {
    newStrand.push(returnRandBase());
  }
  return newStrand;
};

const pAequorFactory = (specimenNum, dna) => {
  return {
    specimenNum,
    dna,
    mutate() {
      // console.log(this.dna);
      const randomDnaIndex = Math.floor(Math.random() * this.dna.length);
      // console.log(randomDnaIndex);
      let randomDnaBase = returnRandBase();
      while(randomDnaBase === this.dna[randomDnaIndex]) {
        randomDnaBase = returnRandBase();
      }
      this.dna[randomDnaIndex] = randomDnaBase;
      // console.log(this.dna);
    },
    compareDna(pAequorObj) {
      // console.log(this.dna);
      // console.log(pAequorObj.dna);
      let identicalDnaBase = 0;
      for(let i = 0; i < this.dna.length; i++) {
        if(this.dna[i] === pAequorObj.dna[i]) identicalDnaBase++;
      }
      const percentage = Math.round(identicalDnaBase / this.dna.length * 1000) / 10;
      console.log(`specimen #${this.specimenNum} and specimen #${pAequorObj.specimenNum} have ${percentage}% DNA in common`);
      return percentage;
      
    },
    willLikelySurvive() {
      let cOrG = this.dna.filter(dnaBase => dnaBase === 'C' || dnaBase === 'G');
      // console.log(this.dna);
      // console.log(cOrG);
      // console.log(cOrG.length);
      cOrG = cOrG.length / this.dna.length * 100;
      // console.log(cOrG + '%');
      return (cOrG >= 60 ? true : false);
    },
    complementStrand() {
      const dnaBaseComplement = {
        A: 'T',
        T: 'A',
        C: 'G',
        G: 'C'
      }
      return this.dna.map(base => dnaBaseComplement[base]);
    }
  };
};

const makePAequorArr = num => {
  arr = [];
  for(let i = 1; i <= num; i++) {
    arr.push(pAequorFactory(i, mockUpStrand()));
  }
  return arr;
}

const mostRelated = pAequorArr => {
  let highestPercentage = 0;
  let mostRelated = [];
  for(let a = 0; a < pAequorArr.length; a++) {
    for(let b = a + 1; b < pAequorArr.length; b++) {
      let percentage = pAequorArr[a].compareDna(pAequorArr[b]);
      if(percentage > highestPercentage) {
        highestPercentage = percentage;
        mostRelated = [];
        mostRelated.push([pAequorArr[a].specimenNum, pAequorArr[b].specimenNum]);
      } else if(percentage === highestPercentage) {
        mostRelated.push([pAequorArr[a].specimenNum, pAequorArr[b].specimenNum]);
      }
    }
  }
  console.log(`Highest relation: ${highestPercentage}%`);
  console.log(`Most related specimens: ${mostRelated.join(' | ')}`);
}

const pAequorArr = makePAequorArr(30);
console.log(pAequorArr);
mostRelated(pAequorArr);