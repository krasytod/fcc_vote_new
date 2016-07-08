var logout_user = function(){
   // reset cookie 
    document.cookie = "name=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";    
    console.log(document.cookie)
    window.history.back();
    }



var make_chart = function(data )
{
    var width = 960,
        height = 500,
        radius = Math.min(width, height) / 2 ;
    
    var color = d3.scale.ordinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
    
    var arc = d3.svg.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);
    
    var labelArc = d3.svg.arc()
        .outerRadius(radius - 40)
        .innerRadius(radius - 40);
    
    var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) { return d.population; });
    
    var svg = d3.select("div.chart").append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
    
    
      var g = svg.selectAll(".arc")
          .data(pie(data))
        .enter().append("g")
          .attr("class", "arc");
    
      g.append("path")
          .attr("d", arc)
          .style("fill", function(d) { return color(d.data.age); });
    
      g.append("text")
          .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
          .attr("dy", ".55em")
          .text(function(d) { return d.data.name+":"+d.data.population; });
    
    function type(d) {
      d.population = +d.population;
      return d;
    }
}