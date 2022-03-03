const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

// var items = ["Buy Food", "Cook Food"];
// let workItems = [];
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
});

const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({ name: "Welcome to your todoList!!" });
const item2 = new Item({ name: "Buy Food" });
const item3 = new Item({ name: "Cook Food" });

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to Database");
          res.redirect("/");
        }
      });
    } else {
      // console.log(foundItems);

      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:customListNAme", function (req, res) {
  const customListNAme = _.capitalize(req.params.customListNAme);

  List.findOne({ name: customListNAme }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //new list
        const list = new List({
          name: customListNAme,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListNAme);
      } else {
        //show existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  var itemName = req.body.newItem;
  var listName = req.body.list;
  // console.log(req.body);
  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }

  const item = new Item({
    name: itemName,
  });

  if (listName == "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("SUccessfully removed");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      {
        $pull: { items: { _id: checkedItemId } },
      },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});
app.post("/work", function (req, res) {
  let item = req.body.newItem;
  workItems.push(item);
  res.redirect("/work");
});
app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("server is running on port 3000");
});
