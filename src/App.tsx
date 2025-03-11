import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";


function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

class Entry {
  public name: string;
  public email: string;
  public note: string;

  public constructor(name: string, email: string, note?: string) {
    this.name = name;
    this.email = email;
    this.note = note || "-";
  }
}

class PhoneBook {
  public entries: Entry[];
  private names = ["Bob", "Sam", "John", "Matt", "Mike"];
  private domains = ["localhost.com", "real.com", "fake.re"];

  public constructor() {
    this.entries = [
      new Entry("John", "john@localhost.com", ":)"),
      new Entry("Sam", "sam@localhost.com")
    ];
  }

  public addRandom() {
    const ind = getRandomInt(this.names.length);
    this.entries = [
      ...this.entries,
      new Entry(
        this.names[ind],
        `${this.names[ind]}@${this.domains[getRandomInt(this.domains.length)]}`
      )
    ];
  }
}

const PhoneBookApp: React.FC = () => {
  const pb = new PhoneBook();
  const [entries, setEntries] = useState<Entry[]>(pb.entries);
  const [displayText, setDisplay] = useState<string>("No info set.");

  function addEntry() {
    pb.entries = entries;
    pb.addRandom();
    setEntries([...pb.entries]);
    const newEntry = pb.entries[pb.entries.length - 1];
    setDisplay(`${newEntry.name} | ${newEntry.email} | ${newEntry.note}`);
  }

  function updateEntry(index: number, field: keyof Entry, value: string) {
    const newEntries = [...entries];
    newEntries[index][field] = value.slice(0, 30);
    setEntries(newEntries);
  }

  function deleteEntry(index: number) {
    const newEntries = [...entries];
    newEntries.splice(index, 1);
    setEntries(newEntries); 
  }
  

  function onDragEnd(result: any) {
    if (!result.destination) return;
    const newEntries = Array.from(entries);
    const [movedItem] = newEntries.splice(result.source.index, 1);
    newEntries.splice(result.destination.index, 0, movedItem);
    setEntries(newEntries);
  }

  return (
    <div>
      <button onClick={addEntry}>Append</button>
      <h1>Phonebook Entries</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="phonebook">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {entries.map((entry, index) => (
                <Draggable key={index} draggableId={index.toString()} index={index}> 
                  {(provided) => (
                    <li 
                      ref={provided.innerRef} 
                      {...provided.draggableProps} 
                      {...provided.dragHandleProps}
                    >
                      <input
                        type="text"
                        value={entry.name}
                        maxLength={30}
                        onChange={(e) => updateEntry(index, "name", e.target.value)}
                      />
                      |
                      <input
                        type="text"
                        value={entry.email}
                        maxLength={30}
                        onChange={(e) => updateEntry(index, "email", e.target.value)}
                      />
                      |
                      <input
                        type="text"
                        value={entry.note}
                        maxLength={30}
                        onChange={(e) => updateEntry(index, "note", e.target.value)}
                      />
                      <button onClick={() => deleteEntry(index)}>Delete</button>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      <h2>Latest Info: {displayText}</h2>
    </div>
  );
};

export default PhoneBookApp;
