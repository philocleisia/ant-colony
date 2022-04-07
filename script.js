var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var p = []; // points
var e = []; // edges
var path = [];
var k = 0;
var hue = 0;
var home = 0;
var iteration = 0;
var alpha = 10; // стадность (параметр влияния феромона)
var beta = 10; // жадность (параметр влияния видимости)
var rho = .3 // скорость испарения феромона
canvas.onclick = function(event)
{
    p[k] = {
        "k": k,
        "x": event.offsetX,
        "y": event.offsetY,
        "h": hue
    };
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNet();
    drawPoints();
    console.log(k, p[k].x, p[k].y, p[k].h);
    k++;
    hue = (hue + 23) % 360;
}

function connect(p1, p2)
{
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.closePath();
    ctx.stroke();
}

function drawNet()
{
    ctx.strokeStyle = "rgb(60, 60, 60)";
    ctx.lineWidth = .5;
    ctx.setLineDash([5, 10]);
    p.forEach((p1) => {
        p.forEach((p2) => {
            connect(p1, p2);
        })
    })
}

function drawPoints()
{
    p.forEach((point) => {
        ctx.fillStyle = "hsl(" + point.h + ", 100%, 60%)";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    })
}

function drawPath(path)
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNet();
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    for (let i = 0; i < path.length - 1; i++)
    {
        let gradient = ctx.createLinearGradient(p[path[i]].x, p[path[i]].y, p[path[i + 1]].x, p[path[i + 1]].y);
        gradient.addColorStop(0, "hsl(" + p[path[i]].h + ", 100%, 60%)");
        gradient.addColorStop(1, "hsl(" + p[path[i + 1]].h + ", 100%, 60%)");
        ctx.strokeStyle = gradient;
        connect(p[path[i]], p[path[i + 1]]);
    }
    let gradient = ctx.createLinearGradient(p[path[path.length - 1]].x, p[path[path.length - 1]].y, p[path[0]].x, p[path[0]].y);
    gradient.addColorStop(0, "hsl(" + p[path[path.length - 1]].h + ", 100%, 60%)");
    gradient.addColorStop(1, "hsl(" + p[path[0]].h + ", 100%, 60%)");
    ctx.strokeStyle = gradient;
    connect(p[path[path.length - 1]], p[path[0]]);
    drawPoints();
}

function distance(p1, p2)
{
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function pathLength(path)
{
    var length = 0;
    for (let i = 0; i < path.length - 1; i++)
    {
        length += e[path[i]][path[i + 1]].length;
    }
    length += e[path[path.length - 1]][path[0]].length;
    return length;
}

function nextIteration()
{
    // Инициализация
    if (iteration == 0)
    {
        home = randomInt(0, p.length - 1);
        for (let i = 0; i < p.length; i++)
        {
            e[i] = [];
            for (let j = 0; j < p.length; j++)
            {
                e[i][j] = {
                    "length": distance(p[i], p[j]),
                    "visibility": distance(p[i], p[j]) ? 1 / distance(p[i], p[j]) : 0,
                    "pheromone": .5,
                    "probability": 0
                };
            }
        }
    }
    var unvisited = [];
    for (let i = 0; i < p.length; i++)
    {
        if (i != home)
        {
            unvisited.push(i);
        }
    }
    var cur = home;

    // Построение пути
    path = [home];
    while (unvisited.length != 0)
    {
        // Рассчёт вероятностей
        unvisited.forEach(next => {
            e[cur][next].probability = Math.pow(e[cur][next].pheromone, alpha) * Math.pow(e[cur][next].visibility, beta);
        });
        var sum = 0;
        unvisited.forEach(next => {
            sum += e[cur][next].probability;
        });
        unvisited.forEach(next => {
            e[cur][next].probability /= sum;
        });
        var rnd = Math.random();
        sum = 0;
        // Выбор следующей точки
        for (let i = 0; i < unvisited.length; i++)
        {
            sum += e[cur][unvisited[i]].probability;
            if (sum >= rnd)
            {
                path.push(unvisited[i]);
                cur = unvisited.splice(i, 1);
                break;
            }
        }
    }
    drawPath(path);

    // Обновление феромона
    for (let i = 0; i < p.length; i++)
    {
        for (let j = 0; j < p.length; j++)
        {
            e[i][j].pheromone = (1 - rho) * e[i][j].pheromone;
        }
    }
    var delta = 1 / pathLength(path); // увеличение феромона
    for (let i = 0; i < path.length - 1; i++)
    {
        e[path[i]][path[i + 1]].pheromone += delta;
    }
    e[path[path.length - 1]][path[0]].pheromone += delta;
    iteration++;
}

function randomInt(min, max)
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}