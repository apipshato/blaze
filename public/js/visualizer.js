class Visualizer {

  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.svgContainer = d3
                        .select('#app')
                        .append('svg')
                        .attr('width', width)
                        .attr('height', height);

    this.nodes = [];
    this.sender = {
      percentage: 0
    };
  }


  /**
   * Updates the positions of all the connected nodes in the graph
   */
  updateAllPos() {
    // Get only the connected nodes by removing the client node
    const nodes = this.nodes.slice(1);

    const divisions = 360/nodes.length;

    nodes.forEach((node, i) => {
      // Calculate the angle that line makes
      const angle = divisions*(i+1)*Math.PI/180;
      
      // Calculate the slope from the angle
      const slope = Math.tan(angle);

      // Assume some value of y from the start
      let cy = 100/this.height * 100;

      // If angle is greater than 180deg, then shift y coordinates to opposite quadrants
      if (angle > Math.PI)
        cy += 50;

      // Calculate x coordinate using the simple line equation
      let cx = ((this.height/2 - cy) / slope) + this.width/2;

      // Handles the special cases
      if (angle == Math.PI) {
        cx = this.width/2 - 120;
        cy = 50;
      }
      else if (angle == 2*Math.PI) {
        cx = this.width/2 + 120;
        cy = 50;
      }

      // Converts x coordinate to a percentage value
      cx = cx/this.width * 100;

      node.cx = cx+'%';
      node.cy = cy+'%';
    });
  }

  /**
   * Adds a node to the graph
   * @param {String} name Name/Identifier of the node. Must be unique
   * @param {Array} pos Array of two elements that have percentage location values of the node
   * @param {Boolean} isClient Dentoes whether the node is the current client
   */
  addNode(name, pos, isClient) {

    const nodeData = {
      name,
      radius: isClient ? 40 : 30,
      cx: pos ? pos[0] : '30%',
      cy: pos ? pos[1] : '30%',
      textColor: isClient ? '#C5C7CC' : '#636979'
    };

    const nodeDuplID = this.nodes.findIndex(node => node.name === name);

    if (nodeDuplID > -1)
      this.nodes[nodeDuplID] = nodeData;
    else
      this.nodes.push(nodeData);

    if (!pos) this.updateAllPos();

    this.updateSVG();
  }

  /**
   * Removes a node from the graph
   * @param {String} name Identifier of the node
   */
  removeNode(name) {
    const nodeDuplID = this.nodes.findIndex(node => node.name === name);

    if (nodeDuplID > -1) {
      this.nodes.splice(nodeDuplID, 1);
      
      this.updateAllPos();
      this.updateSVG();
    }

  }

  /**
   * Updates the entire graph by regenerating the SVG
   */
  updateSVG() {
    /**
     * Empty the SVG container, and add the updated nodes, connections and labels
     */
    this.svgContainer.selectAll('*').remove();

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i+1; j < this.nodes.length; j++) {
        
        this.svgContainer.append('line')
        .attr('x1', this.nodes[i].cx)
        .attr('y1', this.nodes[i].cy)
        .attr('x2', this.nodes[j].cx)
        .attr('y2', this.nodes[j].cy)
        .style('stroke-width', 1.3)
        .style('stroke', '#636979');
      }
    }

    if (this.sender && this.sender.name) {
      this.addSender(this.sender.name, this.sender.percentage);

      this.nodes.forEach(node => {
        if (node.name === this.sender.name) return;

        const x1 = parseInt(this.sender.cx)/100*this.width;
        const y1 = parseInt(this.sender.cy)/100*this.height;
        const x2 = parseInt(node.cx)/100*this.width;
        const y2 = parseInt(node.cy)/100*this.height;

        const dis = Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
        const angle = Math.atan( (y2-y1)/(x2-x1) );

        let r = this.sender.percentage/100*dis;
        if ((x2 < x1 || y2 < y1) && !(x2 >= x1 && y2 <= y1))
          r = -r;

        this.svgContainer.append('line')
        .style('stroke', '#3BE8B0')
        .style('stroke-width', 2)    
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x1 + r*Math.cos(angle))
        .attr('y2', y1 + r*Math.sin(angle));
      });
    }

    const primaryColor = d => d.name === this.sender.name || this.sender.percentage >= 99 ? '#3BE8B0' : '#636979';

    this.svgContainer
    .append('circle')
    .attr('cx', '50%')
    .attr('cy', '50%')
    .attr('r', 50)
    .style('fill', () => {
      if (this.sender.name === this.nodes[0].name)
        return 'rgba(59, 232, 176, 0.1)';

      return 'rgba(99, 105, 121, 0.1)';
    });

    this.svgContainer
    .append('circle')
    .attr('cx', '50%')
    .attr('cy', '50%')
    .attr('r', 60)
    .style('fill', () => {
      if (this.sender.name === this.nodes[0].name)
        return 'rgba(59, 232, 176, 0.1)';

      return 'rgba(99, 105, 121, 0.1)';
    });

    this.svgContainer
    .selectAll()
    .data(this.nodes)
    .enter()
    .append('circle')
    .attr('cx', d => d.cx)
    .attr('cy', d => d.cy)
    .attr('r', d => d.radius)
    .style('fill', '#0D1322')
    .style('stroke', d => primaryColor(d))
    .style('stroke-width', 2.5);

    const text = this.svgContainer.selectAll('text')
                .data(this.nodes)
                .enter();
 
    const avatars = text.append('text')
                  .attr('x', d => d.cx)
                  .attr('y', d => d.cy)
                  .text(d => d.name[0].toUpperCase())
                  .attr('font-family', '"Rubik", sans-serif')
                  .attr('text-anchor', 'middle')
                  .attr('dominant-baseline', 'central')
                  .attr('font-size', d => d.radius/1.2)
                  .attr('fill', d => primaryColor(d));

    const labels = text
                .append('text')
                .attr('x', d => d.cx)
                .attr('y', d => parseInt(d.cy)/100*this.height + d.radius + 20)
                .text(d => d.name)
                .attr('font-family', '"Rubik", sans-serif')
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'central')
                .attr('font-size', 13)
                .attr('fill', d => d.textColor)
                .attr('font-weight', 500);
  }


  addSender(name, percentage=0) {
    this.sender = {
      ...this.nodes.filter(node => node.name === name)[0],
      percentage
    };
  }

  removeSender() {
    this.sender = {
      percentage: 0
    };

    this.updateSVG();
  }

  setTransferPercentage(percentage) {
    this.sender.percentage = percentage;

    this.updateSVG();
  }

}