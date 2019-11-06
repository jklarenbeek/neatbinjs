
Neat.prototype.createPool = function (network) {
  this.population = [];

  for (var i = 0; i < this.popsize; i++) {
    var copy;
    if (this.template) {
      copy = Network.fromJSON(network.toJSON());
    } else {
      copy = new Network(this.input, this.output);
    }
    copy.score = undefined;
    this.population.push(copy);
  }
}
