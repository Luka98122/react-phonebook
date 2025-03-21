import React, { useState, useEffect, useRef } from "react";
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
  public entries: Entry[] = [];
  private names = ["Bob", "Sam", "John", "Matt", "Mike"];
  private domains = ["localhost.com", "real.com", "fake.re"];

  public constructor() {
    this.entries = [
      new Entry("John", "john@localhost.com", ":)"),
      new Entry("Sam", "sam@localhost.com"),
    ];
  }

  public add(name: string, email: string, note: string) {
    this.entries.push(new Entry(name, email, note));
  }

  public addRandom() {
    const ind = getRandomInt(this.names.length);
    const randomEntry = new Entry(
      this.names[ind],
      `${this.names[ind]}@${this.domains[getRandomInt(this.domains.length)]}`
    );
    this.entries.push(randomEntry);
  }
}

const PhoneBookApp: React.FC = () => {
  const pbRef = useRef(new PhoneBook()); // Persist `PhoneBook` instance
  const [entries, setEntries] = useState<Entry[]>(pbRef.current.entries);
  const [displayText, setDisplay] = useState<string>("No info set.");
  const [showInputDiv, setShowInputDiv] = useState<boolean>(false);

  const [newName, setNewName] = useState<string>("");
  const [newEmail, setNewEmail] = useState<string>("");
  const [newNote, setNewNote] = useState<string>("");

  function addEntry() {
    if (newName && newEmail) {
      console.log(`Will add - ${pbRef.current.entries.length}`);

      pbRef.current.add(newName, newEmail, newNote);
      console.log(`Added - ${pbRef.current.entries.length}`);

      setEntries([...pbRef.current.entries]); // Update state from `pb.entries`
      console.log(`Set - ${entries.length} | ${pbRef.current.entries.length}`);

      setDisplay(`${newName} | ${newEmail} | ${newNote}`);
      setShowInputDiv(false);
    }
  }

  useEffect(() => {
    console.log(`Updated state - ${entries.length}`);
  }, [entries]);

  function updateEntry(index: number, field: keyof Entry, value: string) {
    const newEntries = [...entries];
    newEntries[index][field] = value.slice(0, 30);
    setEntries(newEntries);
  }

  function deleteEntry(index: number) {
    pbRef.current.entries.splice(index, 1); // Also delete from the phonebook instance
    setEntries([...pbRef.current.entries]);
  }

  function onDragEnd(result: any) {
    if (!result.destination) return;
    const newEntries = Array.from(entries);
    const [movedItem] = newEntries.splice(result.source.index, 1);
    newEntries.splice(result.destination.index, 0, movedItem);
    setEntries(newEntries);
  }

  return (
    <div className="container">
      <h1>📚 Phonebook</h1>
      <button onClick={() => setShowInputDiv(true)} className="addButton">
        ➕ Add Entry
      </button>

      {showInputDiv && (
        <>
          <div className="overlay" onClick={() => setShowInputDiv(false)}></div>
          <div className="input-container">
            <input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="Note"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <button onClick={addEntry}>Add Entry</button>
            <button onClick={() => setShowInputDiv(false)}>Cancel</button>
          </div>
        </>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="phonebook">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef} className="phonebook-list">
              {entries.map((entry, index) => (
                <Draggable key={index} draggableId={index.toString()} index={index}>
                  {(provided) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="entry"
                    >
                      <input
                        type="text"
                        value={entry.name}
                        onChange={(e) => updateEntry(index, "name", e.target.value)}
                      />
                      <input
                        type="text"
                        value={entry.email}
                        onChange={(e) => updateEntry(index, "email", e.target.value)}
                      />
                      <input
                        type="text"
                        value={entry.note}
                        onChange={(e) => updateEntry(index, "note", e.target.value)}
                      />
                      <button onClick={() => deleteEntry(index)} className="deleteButton">
                        ❌
                      </button>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>

      <h2 className="latest-info">Latest Entry: {displayText}</h2>
    </div>
  );
};

export default PhoneBookApp;
