//https://polar-beach-44276.herokuapp.com/ 
const express= require('express');
const app=express();
const _=require('lodash');
const date=require(__dirname+"/date.js");
const mongoose=require('mongoose');
app.set("view engine","ejs")
app.use(express.urlencoded({extended:true})); //body parser
app.use(express.static('public'));   //for storing static pages

// var todoItems=[];
// var workItems=[];
var defaultItems=[{item:"a"},{item:"b"},{item:"c"}];

mongoose.connect("mongodb+srv://abhinav:Abhin@v20@cluster0.hmev8.mongodb.net/todo",{
    useNewUrlParser:true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(()=>{
    console.log(`connection to database established`);
}).catch(err=>{
    console.log(`db error ${err.message}`);
    process.exit(-1);
});

const itemsSchema= new mongoose.Schema({
    item:String
});
const Item=mongoose.model("Item",itemsSchema);
Item.find(function(err,items){
    if(err) console.log(err);
    else{
        if(items.length===0){
            Item.insertMany(defaultItems,function(err){
                if(err) console.log(err);
                else console.log("Successfuly added all the default items");
            });
        }
    }
});

const listSchema= new mongoose.Schema({
    name:String,
    items:[itemsSchema]
});
const List= mongoose.model("List",listSchema);

var day=date.getDate();
app.get('/',function(req,res){
    Item.find(function(err,items){
        if(err) console.log(err);
        else{
            res.render("list",{listTitle:day, newListItems:items});
        }
    });   
}); 

app.get('/:categories',function(req,res){
    const customListElemet = _.capitalize(req.params.categories);  //_ is lodash
    List.findOne({name:customListElemet},function(err,foundList){
        if(!err){
            if(!foundList){
                //add new list
                const list = new List({
                    name:customListElemet,
                    items:defaultItems
                });
                list.save();
                res.redirect("/"+customListElemet);
            }
            else{
                //show new list
                res.render("list",{listTitle:foundList.name, newListItems:foundList.items,})
            }
        }
    })
    
});

// app.post('/',function(req,res){
//     const list=req.body.list;
//     const item=req.body.newItem;
//     if(list === "Work List"){
//         workItem.push(item);
//         res.redirect('/work');
//     }
//     else{
//         items.push(item);
//         res.redirect("/"); 
//     }
// });
app.post('/',function(req,res){
    const listName=req.body.list;
    const new_item=new Item({item:req.body.newItem});
    
    if(listName===day){
        new_item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name:listName},function(err,foundList){
            if(!err){
                foundList.items.push(new_item);
                foundList.save();
                res.redirect("/"+listName)
            }
        })
    }

});

app.post('/delete',function(req,res){
    const checkedItemID=req.body.checkbox;
    const listName=req.body.listName;
    if(listName===day){
        Item.findByIdAndRemove(checkedItemID,function(err){
            if(err) console.log(err);
            else console.log(`successfully deleted the checked item`);
        });
        res.redirect("/");
    }
    else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemID}}},function(err,foundList){
            if(err) console.log(err);
            else{
                res.redirect("/"+listName);
            } 
        });
    }
    
});


app.listen(process.env.PORT || 3000, function(){
    console.log("server started");
});